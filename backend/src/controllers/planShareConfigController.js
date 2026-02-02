import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { KPI_CATEGORY_TO_ENUM } from '../utils/prismaHelpers.js';

// @desc    Get plan share configs
// @route   GET /api/plan-share-config
// @access  Private (Admin)
export const getPlanShareConfigs = asyncHandler(async (req, res) => {
  const { branch_code, kpi_category, isActive } = req.query;

  const where = {};
  if (branch_code) where.branch_code = branch_code.toUpperCase().trim();
  if (kpi_category) where.kpi_category = KPI_CATEGORY_TO_ENUM[kpi_category] || kpi_category;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const configs = await prisma.planShareConfig.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ kpi_category: 'asc' }, { branch_code: 'asc' }],
  });

  res.status(200).json({
    success: true,
    count: configs.length,
    data: configs.map(c => ({ ...c, _id: c.id })),
  });
});

// @desc    Get single plan share config
// @route   GET /api/plan-share-config/:id
// @access  Private (Admin)
export const getPlanShareConfig = asyncHandler(async (req, res) => {
  const config = await prisma.planShareConfig.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'Plan share config not found',
    });
  }

  res.status(200).json({
    success: true,
    data: { ...config, _id: config.id },
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

  const kpiEnum = KPI_CATEGORY_TO_ENUM[kpi_category] || kpi_category;
  const bCode = branch_code ? branch_code.toUpperCase().trim() : null;

  const existing = await prisma.planShareConfig.findFirst({
    where: {
      branch_code: bCode,
      kpi_category: kpiEnum,
      isActive: true,
    },
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An active plan share config already exists for this branch and KPI category',
    });
  }

  const config = await prisma.planShareConfig.create({
    data: {
      branch_code: bCode,
      kpi_category: kpiEnum,
      share_branch_manager: parseFloat(planShares['Branch Manager'] || 0),
      share_msm: parseFloat(planShares['Member Service Manager (MSM)'] || planShares['MSM'] || 0),
      share_accountant: parseFloat(planShares['Accountant'] || 0),
      share_mso: parseFloat(planShares['MSO'] || 0),
      total_percent: parseFloat(Object.values(planShares).reduce((a, b) => a + b, 0)),
      createdById: req.user.id,
      isActive: true,
    },
  });

  await logAudit(
    req.user.id,
    'Plan Share Config Created',
    'PlanShareConfig',
    config.id,
    `${kpi_category} - ${branch_code || 'Default'}`,
    `Created plan share config`,
    req
  );

  res.status(201).json({
    success: true,
    data: { ...config, _id: config.id },
  });
});

// @desc    Update plan share config
// @route   PUT /api/plan-share-config/:id
// @access  Private (Admin)
export const updatePlanShareConfig = asyncHandler(async (req, res) => {
  const existingConfig = await prisma.planShareConfig.findUnique({ where: { id: req.params.id } });

  if (!existingConfig) {
    return res.status(404).json({
      success: false,
      message: 'Plan share config not found',
    });
  }

  const updateData = {};
  if (req.body.planShares) {
    const ps = req.body.planShares;
    if (ps['Branch Manager'] !== undefined) updateData.share_branch_manager = parseFloat(ps['Branch Manager']);
    if (ps['Member Service Manager (MSM)'] !== undefined) updateData.share_msm = parseFloat(ps['Member Service Manager (MSM)']);
    if (ps['Accountant'] !== undefined) updateData.share_accountant = parseFloat(ps['Accountant']);
    if (ps['MSO'] !== undefined) updateData.share_mso = parseFloat(ps['MSO']);

    // Calculate new total
    const current = {
      'Branch Manager': updateData.share_branch_manager ?? existingConfig.share_branch_manager,
      'MSM': updateData.share_msm ?? existingConfig.share_msm,
      'Accountant': updateData.share_accountant ?? existingConfig.share_accountant,
      'MSO': updateData.share_mso ?? existingConfig.share_mso,
    };
    updateData.total_percent = Object.values(current).reduce((a, b) => a + b, 0);
  }

  updateData.updatedById = req.user.id;

  const config = await prisma.planShareConfig.update({
    where: { id: req.params.id },
    data: updateData,
  });

  await logAudit(
    req.user.id,
    'Plan Share Config Updated',
    'PlanShareConfig',
    config.id,
    `${config.kpi_category} - ${config.branch_code || 'Default'}`,
    `Updated plan share config`,
    req
  );

  res.status(200).json({
    success: true,
    data: { ...config, _id: config.id },
  });
});

// @desc    Delete plan share config (soft delete)
// @route   DELETE /api/plan-share-config/:id
// @access  Private (Admin)
export const deletePlanShareConfig = asyncHandler(async (req, res) => {
  const config = await prisma.planShareConfig.findUnique({ where: { id: req.params.id } });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'Plan share config not found',
    });
  }

  await prisma.planShareConfig.update({
    where: { id: req.params.id },
    data: { isActive: false }
  });

  await logAudit(
    req.user.id,
    'Plan Share Config Deleted',
    'PlanShareConfig',
    config.id,
    `${config.kpi_category} - ${config.branch_code || 'Default'}`,
    `Deactivated plan share config`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Plan share config deactivated successfully',
  });
});
