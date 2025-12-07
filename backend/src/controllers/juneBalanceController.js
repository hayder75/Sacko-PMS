import JuneBalance from '../models/JuneBalance.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import XLSX from 'xlsx';
import fs from 'fs';

// @desc    Import baseline balance snapshot
// @route   POST /api/june-balance/import
// @access  Private (Admin)
export const importJuneBalance = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a baseline balance file',
    });
  }

  // Get baseline period and date from request body
  const baseline_period = req.body.baseline_period || '2025';
  const baseline_date_str = req.body.baseline_date || '2025-06-30';
  const make_active = req.body.make_active !== 'false'; // Default to true
  const baseline_date = new Date(baseline_date_str);

  if (isNaN(baseline_date.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid baseline_date format. Use YYYY-MM-DD',
    });
  }

  // Validate baseline_period is not empty
  if (!baseline_period || baseline_period.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'baseline_period is required',
    });
  }

  try {
    // If making this baseline active, deactivate all other baselines
    if (make_active) {
      await JuneBalance.updateMany(
        { is_active: true },
        { is_active: false }
      );
    }

    // Parse Excel file
    let workbook;
    try {
      workbook = XLSX.readFile(req.file.path);
    } catch (error) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Failed to parse file. Please ensure it is a valid Excel (.xlsx) or CSV file.',
      });
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'File has no sheets',
      });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File is empty or invalid',
      });
    }

    // Process each row
    const results = {
      imported: 0,
      updated: 0,
      errors: [],
    };

    for (const row of data) {
      try {
        const account_id = row.account_id || row.accountId || row['Account ID'];
        const june_balance = parseFloat(row.june_balance || row.juneBalance || row['June Balance'] || 0);
        const accountNumber = row.accountNumber || row.account_number || row['Account Number'];
        const branch_code = row.branch_code || row.branchCode || row['Branch Code'];

        if (!account_id) {
          results.errors.push(`Row missing account_id: ${JSON.stringify(row)}`);
          continue;
        }

        // Upsert June balance record with baseline_period
        const existing = await JuneBalance.findOne({
          account_id: String(account_id),
          baseline_period: baseline_period,
        });

        await JuneBalance.findOneAndUpdate(
          { 
            account_id: String(account_id),
            baseline_period: baseline_period,
          },
          {
            account_id: String(account_id),
            accountNumber: accountNumber ? String(accountNumber) : undefined,
            june_balance: june_balance || 0,
            branch_code: branch_code ? String(branch_code) : undefined,
            baseline_period: baseline_period,
            baseline_date: baseline_date,
            is_active: make_active,
            importedBy: req.user._id,
            importedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        if (existing) {
          results.updated++;
        } else {
          results.imported++;
        }
      } catch (error) {
        results.errors.push(`Error processing row: ${error.message}`);
      }
    }

    // Delete uploaded file
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
      // Continue even if file deletion fails
    }

    await logAudit(
      req.user._id,
      'Baseline Balance Import',
      'JuneBalance',
      null,
      `${baseline_period} Baseline (${baseline_date_str})`,
      `Imported ${results.imported} new, updated ${results.updated} account balances`,
      req
    );

    res.status(200).json({
      success: true,
      message: `Successfully imported ${results.imported} new and updated ${results.updated} account balances for ${baseline_period} baseline`,
      data: {
        ...results,
        baseline_period,
        baseline_date: baseline_date_str,
        is_active: make_active,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Get June balance by account (uses active baseline by default)
// @route   GET /api/june-balance/:accountId
// @access  Private
export const getJuneBalance = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const { baseline_period } = req.query;

  const query = {
    $or: [
      { account_id: accountId },
      { accountNumber: accountId },
    ],
  };

  // If baseline_period specified, use it; otherwise use active baseline
  if (baseline_period) {
    query.baseline_period = baseline_period;
  } else {
    query.is_active = true;
  }

  const juneBalance = await JuneBalance.findOne(query);

  if (!juneBalance) {
    return res.status(404).json({
      success: false,
      message: 'Baseline balance not found for this account',
    });
  }

  res.status(200).json({
    success: true,
    data: juneBalance,
  });
});

// @desc    Get all June balances
// @route   GET /api/june-balance
// @access  Private (Admin)
export const getAllJuneBalances = asyncHandler(async (req, res) => {
  const { branch_code, baseline_period, is_active } = req.query;

  const query = {};
  if (branch_code) query.branch_code = branch_code;
  if (baseline_period) query.baseline_period = baseline_period;
  if (is_active !== undefined) query.is_active = is_active === 'true';

  const balances = await JuneBalance.find(query)
    .sort({ account_id: 1, baseline_period: -1 })
    .limit(1000); // Limit for performance

  res.status(200).json({
    success: true,
    count: balances.length,
    data: balances,
  });
});

// @desc    Get list of all baseline periods
// @route   GET /api/june-balance/periods/list
// @access  Private (Admin)
export const getBaselinePeriods = asyncHandler(async (req, res) => {
  const periods = await JuneBalance.distinct('baseline_period');
  const periodsWithDetails = await Promise.all(
    periods.map(async (period) => {
      const count = await JuneBalance.countDocuments({ baseline_period: period });
      const active = await JuneBalance.findOne({ baseline_period: period, is_active: true });
      const sample = await JuneBalance.findOne({ baseline_period: period });
      return {
        baseline_period: period,
        baseline_date: sample?.baseline_date,
        account_count: count,
        is_active: !!active,
        importedAt: sample?.importedAt,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: periodsWithDetails.sort((a, b) => b.baseline_period.localeCompare(a.baseline_period)),
  });
});

// @desc    Activate a baseline period
// @route   PUT /api/june-balance/periods/:period/activate
// @access  Private (Admin)
export const activateBaselinePeriod = asyncHandler(async (req, res) => {
  const { period } = req.params;

  // Deactivate all other baselines
  await JuneBalance.updateMany(
    { is_active: true },
    { is_active: false }
  );

  // Activate this baseline period
  const result = await JuneBalance.updateMany(
    { baseline_period: period },
    { is_active: true }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({
      success: false,
      message: `No baseline found for period ${period}`,
    });
  }

  await logAudit(
    req.user._id,
    'Baseline Activation',
    'JuneBalance',
    null,
    `${period} Baseline`,
    `Activated ${period} baseline period`,
    req
  );

  res.status(200).json({
    success: true,
    message: `Activated ${period} baseline period`,
    data: {
      baseline_period: period,
      accounts_updated: result.modifiedCount,
    },
  });
});

