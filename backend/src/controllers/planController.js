import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { cascadeBranchPlan } from '../utils/planCascade.js';
import XLSX from 'xlsx';
import fs from 'fs';
import { KPI_CATEGORY_TO_ENUM } from '../utils/prismaHelpers.js';

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

  // Find branchId from branch_code
  const branch = await prisma.branch.findUnique({
    where: { code: branch_code.toUpperCase().trim() }
  });

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: `Branch with code ${branch_code} not found`,
    });
  }

  // Convert KPI category string to enum
  const kpiEnum = KPI_CATEGORY_TO_ENUM[kpi_category] || kpi_category;

  // Check if plan already exists
  const existingPlan = await prisma.plan.findFirst({
    where: {
      branch_code: branch_code.toUpperCase().trim(),
      kpi_category: kpiEnum,
      period,
      status: { in: ['Draft', 'Active'] },
    },
  });

  if (existingPlan) {
    return res.status(400).json({
      success: false,
      message: 'A plan already exists for this branch, KPI category, and period',
    });
  }

  // Create plan
  const plan = await prisma.plan.create({
    data: {
      branch_code: branch_code.toUpperCase().trim(),
      branchId: branch.id,
      kpi_category: kpiEnum,
      period,
      target_value: parseFloat(target_value),
      target_type: target_type || 'incremental',
      status: 'Active',
      createdById: req.user.id,
    },
  });

  // Cascade to staff
  const cascadeResult = await cascadeBranchPlan(plan);

  await logAudit(
    req.user.id,
    'Plan Created',
    'Plan',
    plan.id,
    `${kpi_category} - ${branch_code}`,
    `Created plan: ${kpi_category} for ${branch_code}`,
    req
  );

  res.status(201).json({
    success: true,
    message: 'Plan created and cascaded successfully',
    data: { ...plan, _id: plan.id },
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
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false
    });

    data = data.map((row) => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = String(key).toLowerCase().trim().replace(/\s+/g, '_');
        normalizedRow[normalizedKey] = row[key] ? String(row[key]).trim() : '';
      });
      return normalizedRow;
    });

    if (!data || data.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File is empty or invalid',
      });
    }

    const results = {
      created: 0,
      errors: [],
      processed: 0,
    };

    const validKpiCategories = [
      'Deposit Mobilization',
      'Digital Channel Growth',
      'Member Registration',
      'Shareholder Recruitment',
      'Loan & NPL',
      'Customer Base',
    ];

    const validPeriods = ['2025-H2', 'Q4-2025', 'December-2025', '2025'];

    for (const [index, row] of data.entries()) {
      try {
        results.processed++;

        const branch_code = (row.branch_code || row.branchcode || '').toUpperCase().trim();
        const kpi_category = row.kpi_category || row.kpicategory || '';
        const period = row.period || '';
        const target_value = parseFloat(row.target_value || row.targetvalue || 0);

        if (!branch_code || !kpi_category || !period || isNaN(target_value) || target_value <= 0) {
          results.errors.push(`Row ${index + 2}: Missing or invalid required fields.`);
          continue;
        }

        if (!validKpiCategories.includes(kpi_category)) {
          results.errors.push(`Row ${index + 2}: Invalid kpi_category: "${kpi_category}"`);
          continue;
        }

        if (!validPeriods.includes(period)) {
          results.errors.push(`Row ${index + 2}: Invalid period: "${period}"`);
          continue;
        }

        // Find branchId
        const branch = await prisma.branch.findUnique({
          where: { code: branch_code }
        });

        if (!branch) {
          results.errors.push(`Row ${index + 2}: Branch with code ${branch_code} not found`);
          continue;
        }

        const kpiEnum = KPI_CATEGORY_TO_ENUM[kpi_category];

        // Check if plan already exists
        const existingPlan = await prisma.plan.findFirst({
          where: {
            branch_code,
            kpi_category: kpiEnum,
            period,
            status: { in: ['Draft', 'Active'] },
          },
        });

        if (existingPlan) {
          results.errors.push(`Row ${index + 2}: Plan already exists`);
          continue;
        }

        // Check plan share config
        let planShareConfig = await prisma.planShareConfig.findFirst({
          where: {
            kpi_category: kpiEnum,
            branch_code,
            isActive: true,
          },
        });

        if (!planShareConfig) {
          planShareConfig = await prisma.planShareConfig.findFirst({
            where: {
              kpi_category: kpiEnum,
              branch_code: null,
              isActive: true,
            },
          });
        }

        if (!planShareConfig) {
          results.errors.push(`Row ${index + 2}: No plan share config found`);
          continue;
        }

        // Create plan
        const plan = await prisma.plan.create({
          data: {
            branch_code,
            branchId: branch.id,
            kpi_category: kpiEnum,
            period,
            target_value,
            target_type: 'incremental',
            status: 'Active',
            createdById: req.user.id,
          },
        });

        // Cascade to staff
        try {
          await cascadeBranchPlan(plan);
          results.created++;
        } catch (cascadeError) {
          await prisma.plan.delete({ where: { id: plan.id } });
          results.errors.push(`Row ${index + 2}: Cascade failed - ${cascadeError.message}`);
        }
      } catch (error) {
        results.errors.push(`Row ${index + 2}: Error - ${error.message}`);
      }
    }

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    await logAudit(
      req.user.id,
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
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw error;
  }
});

// @desc    Get all plans
// @route   GET /api/plans
// @access  Private
export const getPlans = asyncHandler(async (req, res) => {
  const { branch_code, kpi_category, period, status } = req.query;

  const where = {};

  if (req.user.role !== 'admin' && req.user.branch_code) {
    where.branch_code = req.user.branch_code;
  }

  if (branch_code) where.branch_code = branch_code.toUpperCase().trim();
  if (kpi_category) where.kpi_category = KPI_CATEGORY_TO_ENUM[kpi_category] || kpi_category;
  if (period) where.period = period;
  if (status) where.status = status;

  const plans = await prisma.plan.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans.map(p => ({ ...p, _id: p.id })),
  });
});

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Private
export const getPlan = asyncHandler(async (req, res) => {
  const plan = await prisma.plan.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
    });
  }

  res.status(200).json({
    success: true,
    data: { ...plan, _id: plan.id },
  });
});

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private (Admin)
export const updatePlan = asyncHandler(async (req, res) => {
  let plan = await prisma.plan.findUnique({ where: { id: req.params.id } });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
    });
  }

  const targetChanged = req.body.target_value && parseFloat(req.body.target_value) !== plan.target_value;

  const updateData = { ...req.body };
  if (updateData.target_value) updateData.target_value = parseFloat(updateData.target_value);
  if (updateData.kpi_category) updateData.kpi_category = KPI_CATEGORY_TO_ENUM[updateData.kpi_category] || updateData.kpi_category;

  plan = await prisma.plan.update({
    where: { id: req.params.id },
    data: updateData,
  });

  if (targetChanged) {
    await cascadeBranchPlan(plan);
  }

  await logAudit(
    req.user.id,
    'Plan Update',
    'Plan',
    plan.id,
    `${plan.kpi_category} - ${plan.branch_code}`,
    `Updated plan`,
    req
  );

  res.status(200).json({
    success: true,
    data: { ...plan, _id: plan.id },
  });
});
