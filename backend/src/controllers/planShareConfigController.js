import PlanShareConfig from '../models/PlanShareConfig.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get plan share configs
// @route   GET /api/plan-share-config
// @access  Private (Admin)
export const getPlanShareConfigs = asyncHandler(async (req, res) => {
  const { branch_code, kpi_category, isActive } = req.query;

  const query = {};
  if (branch_code) query.branch_code = branch_code;
  if (kpi_category) query.kpi_category = kpi_category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const configs = await PlanShareConfig.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ kpi_category: 1, branch_code: 1 });

  res.status(200).json({
    success: true,
    count: configs.length,
    data: configs,
  });
});

// @desc    Get single plan share config
// @route   GET /api/plan-share-config/:id
// @access  Private (Admin)
export const getPlanShareConfig = asyncHandler(async (req, res) => {
  const config = await PlanShareConfig.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'Plan share config not found',
    });
  }

  res.status(200).json({
    success: true,
    data: config,
  });
});

// @desc    Create plan share config
// @route   POST /api/plan-share-config
// @access  Private (Admin)
export const createPlanShareConfig = asyncHandler(async (req, res) => {
  const { branch_code, kpi_category, planShares } = req.body;

  if (!kpi_category || !planShares) {
    return res.status(400).json({
      success: false,
      message: 'kpi_category and planShares are required',
    });
  }

  // Check if config already exists
  const existing = await PlanShareConfig.findOne({
    branch_code: branch_code || null,
    kpi_category,
    isActive: true,
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An active plan share config already exists for this branch and KPI category',
    });
  }

  // Create config (validation happens in model pre-save)
  const config = await PlanShareConfig.create({
    branch_code: branch_code || null,
    kpi_category,
    planShares,
    createdBy: req.user._id,
    isActive: true,
  });

  await logAudit(
    req.user._id,
    'Plan Share Config Created',
    'PlanShareConfig',
    config._id,
    `${kpi_category} - ${branch_code || 'Default'}`,
    `Created plan share config`,
    req
  );

  res.status(201).json({
    success: true,
    data: config,
  });
});

// @desc    Update plan share config
// @route   PUT /api/plan-share-config/:id
// @access  Private (Admin)
export const updatePlanShareConfig = asyncHandler(async (req, res) => {
  let config = await PlanShareConfig.findById(req.params.id);

  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'Plan share config not found',
    });
  }

  // Update planShares if provided
  if (req.body.planShares) {
    config.planShares = { ...config.planShares, ...req.body.planShares };
  }

  config.updatedBy = req.user._id;
  config = await config.save();

  await logAudit(
    req.user._id,
    'Plan Share Config Updated',
    'PlanShareConfig',
    config._id,
    `${config.kpi_category} - ${config.branch_code || 'Default'}`,
    `Updated plan share config`,
    req
  );

  res.status(200).json({
    success: true,
    data: config,
  });
});

// @desc    Delete plan share config (soft delete)
// @route   DELETE /api/plan-share-config/:id
// @access  Private (Admin)
export const deletePlanShareConfig = asyncHandler(async (req, res) => {
  const config = await PlanShareConfig.findById(req.params.id);

  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'Plan share config not found',
    });
  }

  config.isActive = false;
  await config.save();

  await logAudit(
    req.user._id,
    'Plan Share Config Deleted',
    'PlanShareConfig',
    config._id,
    `${config.kpi_category} - ${config.branch_code || 'Default'}`,
    `Deactivated plan share config`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Plan share config deactivated successfully',
  });
});

