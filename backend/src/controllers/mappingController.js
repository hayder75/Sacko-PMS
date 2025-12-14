import AccountMapping from '../models/AccountMapping.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import XLSX from 'xlsx';
import fs from 'fs';

// @desc    Get all account mappings
// @route   GET /api/mappings
// @access  Private
export const getMappings = asyncHandler(async (req, res) => {
  const { branchId, mappedTo, status, accountNumber } = req.query;
  
  const query = {};
  
  // Role-based filtering
  if (req.user.role === 'Staff / MSO') {
    query.mappedTo = req.user._id;
  } else if (branchId) {
    query.branchId = branchId;
  } else if (req.user.branchId) {
    query.branchId = req.user.branchId;
  }

  if (mappedTo) query.mappedTo = mappedTo;
  if (status) query.status = status;
  if (accountNumber) query.accountNumber = { $regex: accountNumber, $options: 'i' };

  const mappings = await AccountMapping.find(query)
    .populate('mappedTo', 'name employeeId role')
    .populate('branchId', 'name code')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: mappings.length,
    data: mappings,
  });
});

// @desc    Create account mapping
// @route   POST /api/mappings
// @access  Private (Branch Manager, HQ Admin)
export const createMapping = asyncHandler(async (req, res) => {
  const mapping = await AccountMapping.create({
    ...req.body,
    mappedBy: req.user._id,
    branchId: req.body.branchId || req.user.branchId,
  });

  await logAudit(
    req.user._id,
    'Mapping Created',
    'Mapping',
    mapping._id,
    mapping.accountNumber,
    `Created mapping for account ${mapping.accountNumber}`,
    req
  );

  res.status(201).json({
    success: true,
    data: mapping,
  });
});

// @desc    Update account mapping
// @route   PUT /api/mappings/:id
// @access  Private (Branch Manager, HQ Admin)
export const updateMapping = asyncHandler(async (req, res) => {
  let mapping = await AccountMapping.findById(req.params.id);

  if (!mapping) {
    return res.status(404).json({
      success: false,
      message: 'Mapping not found',
    });
  }

  mapping = await AccountMapping.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(
    req.user._id,
    'Mapping Updated',
    'Mapping',
    mapping._id,
    mapping.accountNumber,
    `Updated mapping for account ${mapping.accountNumber}`,
    req
  );

  res.status(200).json({
    success: true,
    data: mapping,
  });
});

// @desc    Auto-balance mapping
// @route   POST /api/mappings/auto-balance
// @access  Private (Branch Manager, HQ Admin)
export const autoBalanceMapping = asyncHandler(async (req, res) => {
  const { branchId } = req.body;
  const targetBranchId = branchId || req.user.branchId;

  // Get all unmapped accounts in branch
  const unmappedAccounts = await AccountMapping.find({
    branchId: targetBranchId,
    status: 'Unmapped',
  });

  // Get all active staff in branch
  const staff = await User.find({
    branchId: targetBranchId,
    role: 'Staff / MSO',
    isActive: true,
  });

  if (staff.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No active staff found in branch',
    });
  }

  // Distribute accounts evenly
  const accountsPerStaff = Math.floor(unmappedAccounts.length / staff.length);
  let accountIndex = 0;

  for (let i = 0; i < staff.length && accountIndex < unmappedAccounts.length; i++) {
    const endIndex = Math.min(accountIndex + accountsPerStaff, unmappedAccounts.length);
    
    for (let j = accountIndex; j < endIndex; j++) {
      unmappedAccounts[j].mappedTo = staff[i]._id;
      unmappedAccounts[j].status = 'Active';
      unmappedAccounts[j].isAutoBalanced = true;
      unmappedAccounts[j].mappedBy = req.user._id;
      await unmappedAccounts[j].save();
    }
    
    accountIndex = endIndex;
  }

  await logAudit(
    req.user._id,
    'Mapping Updated',
    'Mapping',
    null,
    'Auto-Balance',
    `Auto-balanced ${unmappedAccounts.length} accounts`,
    req
  );

  res.status(200).json({
    success: true,
    message: `Auto-balanced ${unmappedAccounts.length} accounts`,
    data: {
      accountsBalanced: unmappedAccounts.length,
      staffCount: staff.length,
    },
  });
});

// @desc    Bulk upload account mappings from Excel
// @route   POST /api/mappings/bulk-upload
// @access  Private (Branch Manager, HQ Admin)
export const bulkUploadMappings = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an Excel file',
    });
  }

  const targetBranchId = req.body.branchId || req.user.branchId;
  if (!targetBranchId) {
    return res.status(400).json({
      success: false,
      message: 'Branch ID is required',
    });
  }

  // Verify branch exists
  const branch = await Branch.findById(targetBranchId);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found',
    });
  }

  try {
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
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'File is empty or invalid',
      });
    }

    // Process each row
    const results = {
      created: 0,
      updated: 0,
      errors: [],
      successful: [], // Track successful mappings
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Extract data from row (handle different column name variations)
        const accountNumber = String(row.accountNumber || row['Account Number'] || row.accountNumber || '').trim();
        const customerName = String(row.customerName || row['Customer Name'] || row.customerName || '').trim();
        const balance = parseFloat(row.balance || row['Balance'] || row.current_balance || row['Current Balance'] || 0);
        const juneBalance = parseFloat(row.june_balance || row['June Balance'] || row.juneBalance || 0);
        const staffID = String(row.staffID || row['Staff ID'] || row.staffId || row.employeeId || row['Employee ID'] || '').trim();
        const phoneNumber = String(row.phoneNumber || row['Phone Number'] || row.phone || row['Phone'] || '').trim();

        // Validate required fields
        if (!accountNumber) {
          results.errors.push({
            row: i + 2, // +2 because Excel rows start at 1 and we have header
            accountNumber: accountNumber || 'N/A',
            staffID: staffID || 'N/A',
            customerName: customerName || 'N/A',
            error: 'Account Number is required',
          });
          continue;
        }

        if (!customerName) {
          results.errors.push({
            row: i + 2,
            accountNumber,
            staffID: staffID || 'N/A',
            customerName: customerName || 'N/A',
            error: 'Customer Name is required',
          });
          continue;
        }

        if (!staffID) {
          results.errors.push({
            row: i + 2,
            accountNumber,
            staffID: 'N/A',
            customerName,
            error: 'Staff ID is required',
          });
          continue;
        }

        // Find staff member by employeeId
        const staffMember = await User.findOne({
          employeeId: staffID,
          branchId: targetBranchId,
          isActive: true,
        });

        if (!staffMember) {
          results.errors.push({
            row: i + 2,
            accountNumber,
            staffID,
            customerName,
            error: `Staff member with ID '${staffID}' not found in this branch`,
          });
          continue;
        }

        // Check if mapping already exists
        const existingMapping = await AccountMapping.findOne({ accountNumber });

        if (existingMapping) {
          // Update existing mapping
          existingMapping.customerName = customerName;
          existingMapping.balance = balance;
          existingMapping.current_balance = balance;
          existingMapping.june_balance = juneBalance;
          existingMapping.mappedTo = staffMember._id;
          existingMapping.branchId = targetBranchId;
          existingMapping.mappedBy = req.user._id;
          existingMapping.phoneNumber = phoneNumber || existingMapping.phoneNumber;
          existingMapping.status = 'Active';
          existingMapping.accountType = existingMapping.accountType || 'Savings'; // Default to Savings if not set
          await existingMapping.save();
          results.updated++;
          results.successful.push({
            row: i + 2,
            accountNumber,
            customerName,
            staffID,
            staffName: staffMember.name,
            status: 'Updated',
          });
        } else {
          // Create new mapping
          await AccountMapping.create({
            accountNumber,
            customerName,
            accountType: 'Savings', // Default account type
            balance,
            current_balance: balance,
            june_balance: juneBalance,
            mappedTo: staffMember._id,
            branchId: targetBranchId,
            mappedBy: req.user._id,
            phoneNumber: phoneNumber || undefined,
            status: 'Active',
          });
          results.created++;
          results.successful.push({
            row: i + 2,
            accountNumber,
            customerName,
            staffID,
            staffName: staffMember.name,
            status: 'Created',
          });
        }
      } catch (error) {
        results.errors.push({
          row: i + 2,
          accountNumber: row.accountNumber || row['Account Number'] || 'N/A',
          staffID: row.staffID || row['Staff ID'] || row.staffId || row.employeeId || row['Employee ID'] || 'N/A',
          customerName: row.customerName || row['Customer Name'] || 'N/A',
          error: error.message || 'Unknown error',
        });
      }
    }

    // Delete uploaded file after processing
    if (fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (error) {
        // Silently handle file deletion errors
      }
    }

    await logAudit(
      req.user._id,
      'Bulk Mapping Upload',
      'Mapping',
      null,
      'Bulk Upload',
      `Bulk uploaded mappings: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
      req
    );

    res.status(200).json({
      success: true,
      message: `Bulk upload completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
      data: results,
    });
  } catch (error) {
    // Delete uploaded file on error
    if (fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        // Silently handle file deletion errors
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process bulk upload',
    });
  }
});

