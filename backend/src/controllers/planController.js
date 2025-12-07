import Plan from '../models/Plan.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { cascadeBranchPlan } from '../utils/planCascade.js';
import XLSX from 'xlsx';
import fs from 'fs';

// @desc    Create plan manually
// @route   POST /api/plans
// @access  Private (Admin)
export const createPlan = asyncHandler(async (req, res) => {
  const { branch_code, kpi_category, period, target_value, target_type } = req.body;

  // Validate required fields
  if (!branch_code || !kpi_category || !period || !target_value) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: branch_code, kpi_category, period, target_value',
    });
  }

  // Validate target_type
  if (target_type && target_type !== 'incremental') {
    return res.status(400).json({
      success: false,
      message: 'target_type must be "incremental"',
    });
  }

  // Check if plan already exists
  const existingPlan = await Plan.findOne({
    branch_code,
    kpi_category,
    period,
    status: { $in: ['Draft', 'Active'] },
  });

  if (existingPlan) {
    return res.status(400).json({
      success: false,
      message: 'A plan already exists for this branch, KPI category, and period',
    });
  }

  // Create plan
  const plan = await Plan.create({
    branch_code,
    kpi_category,
    period,
    target_value: parseFloat(target_value),
    target_type: target_type || 'incremental',
    status: 'Active',
    createdBy: req.user._id,
  });

  // Cascade to staff
  const cascadeResult = await cascadeBranchPlan(plan);

  await logAudit(
    req.user._id,
    'Plan Created',
    'Plan',
    plan._id,
    `${kpi_category} - ${branch_code}`,
    `Created plan: ${kpi_category} for ${branch_code}`,
    req
  );

  res.status(201).json({
    success: true,
    message: 'Plan created and cascaded successfully',
    data: plan,
    cascade: cascadeResult,
  });
});

// @desc    Upload plan file and cascade
// @route   POST /api/plans/upload
// @access  Private (Admin)
export const uploadPlan = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a plan file',
    });
  }

  try {
    // Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File is empty or invalid',
      });
    }

    const results = {
      created: 0,
      errors: [],
    };

    // Process each row
    for (const row of data) {
      try {
        const branch_code = row.branch_code || row.branchCode || row['Branch Code'];
        const kpi_category = row.kpi_category || row.kpiCategory || row['KPI Category'];
        const period = row.period || row['Period'];
        const target_value = parseFloat(row.target_value || row.targetValue || row['Target Value'] || 0);
        const target_type = row.target_type || row.targetType || row['Target Type'] || 'incremental';

        // Validate required fields
        if (!branch_code || !kpi_category || !period || !target_value) {
          results.errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
          continue;
        }

        // Validate target_type
        if (target_type !== 'incremental') {
          results.errors.push(`Invalid target_type: ${target_type}. Must be "incremental"`);
          continue;
        }

        // Check if plan already exists
        const existingPlan = await Plan.findOne({
          branch_code: String(branch_code),
          kpi_category: String(kpi_category),
          period: String(period),
          status: { $in: ['Draft', 'Active'] },
        });

        if (existingPlan) {
          results.errors.push(`Plan already exists for ${branch_code}, ${kpi_category}, ${period}`);
          continue;
        }

        // Create plan
        const plan = await Plan.create({
          branch_code: String(branch_code),
          kpi_category: String(kpi_category),
          period: String(period),
          target_value: target_value,
          target_type: 'incremental',
          status: 'Active',
          createdBy: req.user._id,
        });

        // Cascade to staff
        await cascadeBranchPlan(plan);

        results.created++;
      } catch (error) {
        results.errors.push(`Error processing row: ${error.message}`);
      }
    }

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    await logAudit(
      req.user._id,
      'Plan Upload',
      'Plan',
      null,
      'Bulk Plan Upload',
      `Uploaded ${results.created} plans`,
      req
    );

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.created} plans`,
      data: results,
    });
  } catch (error) {
    // Clean up file on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Get all plans
// @route   GET /api/plans
// @access  Private
export const getPlans = asyncHandler(async (req, res) => {
  const { branch_code, kpi_category, period, status } = req.query;
  
  const query = {};
  
  // Role-based filtering
  if (req.user.role !== 'admin' && req.user.branch_code) {
    query.branch_code = req.user.branch_code;
  }
  
  if (branch_code) query.branch_code = branch_code;
  if (kpi_category) query.kpi_category = kpi_category;
  if (period) query.period = period;
  if (status) query.status = status;

  const plans = await Plan.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans,
  });
});

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Private
export const getPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
    });
  }

  res.status(200).json({
    success: true,
    data: plan,
  });
});

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private (Admin)
export const updatePlan = asyncHandler(async (req, res) => {
  let plan = await Plan.findById(req.params.id);

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
    });
  }

  // If target_value changed, re-cascade
  const targetChanged = req.body.target_value && req.body.target_value !== plan.target_value;

  plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Re-cascade if target changed
  if (targetChanged) {
    await cascadeBranchPlan(plan);
  }

  await logAudit(
    req.user._id,
    'Plan Update',
    'Plan',
    plan._id,
    `${plan.kpi_category} - ${plan.branch_code}`,
    `Updated plan`,
    req
  );

  res.status(200).json({
    success: true,
    data: plan,
  });
});
