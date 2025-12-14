import Plan from '../models/Plan.js';
import PlanShareConfig from '../models/PlanShareConfig.js';
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
    // Parse Excel/CSV file - XLSX handles both formats
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Parse to JSON - XLSX automatically handles CSV headers
    let data = XLSX.utils.sheet_to_json(worksheet, { 
      defval: '',
      raw: false 
    });
    
    // Normalize all keys to lowercase with underscores for consistency
    data = data.map((row) => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = String(key).toLowerCase().trim().replace(/\s+/g, '_');
        normalizedRow[normalizedKey] = row[key] ? String(row[key]).trim() : '';
      });
      return normalizedRow;
    });

    if (!data || data.length === 0) {
      fs.unlinkSync(req.file.path);
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

    // Process each row
    for (const [index, row] of data.entries()) {
      try {
        results.processed++;
        
        // Normalize keys to lowercase with underscores
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = String(key).toLowerCase().trim().replace(/\s+/g, '_');
          normalizedRow[normalizedKey] = row[key];
        });
        
        const branch_code = normalizedRow.branch_code || normalizedRow.branchcode || '';
        const kpi_category = normalizedRow.kpi_category || normalizedRow.kpicategory || '';
        const period = normalizedRow.period || '';
        const target_value = parseFloat(normalizedRow.target_value || normalizedRow.targetvalue || 0);
        const target_type = (normalizedRow.target_type || normalizedRow.targettype || 'incremental').toLowerCase().trim();

        // Validate required fields
        if (!branch_code || !kpi_category || !period || isNaN(target_value) || target_value <= 0) {
          results.errors.push(`Row ${index + 2}: Missing or invalid required fields. Found: branch_code="${branch_code}", kpi_category="${kpi_category}", period="${period}", target_value="${target_value}"`);
          continue;
        }

        // Validate target_type
        if (target_type && target_type !== 'incremental') {
          results.errors.push(`Row ${index + 2}: Invalid target_type: "${target_type}". Must be "incremental"`);
          continue;
        }

        // Validate kpi_category against enum
        const validKpiCategories = [
          'Deposit Mobilization',
          'Digital Channel Growth',
          'Member Registration',
          'Shareholder Recruitment',
          'Loan & NPL',
          'Customer Base',
        ];
        if (!validKpiCategories.includes(kpi_category)) {
          results.errors.push(`Row ${index + 2}: Invalid kpi_category: "${kpi_category}". Must be one of: ${validKpiCategories.join(', ')}`);
          continue;
        }

        // Validate period against enum
        const validPeriods = ['2025-H2', 'Q4-2025', 'December-2025', '2025'];
        if (!validPeriods.includes(period)) {
          results.errors.push(`Row ${index + 2}: Invalid period: "${period}". Must be one of: ${validPeriods.join(', ')}`);
          continue;
        }

        // Check if plan already exists
        const existingPlan = await Plan.findOne({
          branch_code: String(branch_code).trim(),
          kpi_category: String(kpi_category).trim(),
          period: String(period).trim(),
          status: { $in: ['Draft', 'Active'] },
        });

        if (existingPlan) {
          results.errors.push(`Row ${index + 2}: Plan already exists for branch_code="${branch_code}", kpi_category="${kpi_category}", period="${period}"`);
          continue;
        }

        // Check if plan share config exists BEFORE creating plan
        let planShareConfig = await PlanShareConfig.findOne({
          kpi_category: String(kpi_category).trim(),
          branch_code: String(branch_code).trim(),
          isActive: true,
        });

        // If no branch-specific config, check for default (branch_code = null)
        if (!planShareConfig) {
          planShareConfig = await PlanShareConfig.findOne({
            kpi_category: String(kpi_category).trim(),
            branch_code: null,
            isActive: true,
          });
        }

        if (!planShareConfig) {
          const errorMsg = `Row ${index + 2}: No plan share configuration found for KPI category "${kpi_category}" and branch "${branch_code}". Please create a plan share config first in Plan Share Config page.`;
          results.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          console.error(`   Searched for: kpi_category="${kpi_category}", branch_code="${branch_code}" and default (null)`);
          continue;
        }

        console.log(`✅ Row ${index + 2}: Plan share config found for ${kpi_category} - ${branch_code || 'Default'}`);
        console.log(`   Config ID: ${planShareConfig._id}, Total: ${planShareConfig.total_percent}%`);

        // Create plan
        let plan;
        try {
          plan = await Plan.create({
            branch_code: String(branch_code).trim(),
            kpi_category: String(kpi_category).trim(),
            period: String(period).trim(),
            target_value: target_value,
            target_type: 'incremental',
            status: 'Active',
            createdBy: req.user._id,
          });
          console.log(`✅ Row ${index + 2}: Plan created successfully - ID: ${plan._id}`);
        } catch (createError) {
          results.errors.push(`Row ${index + 2}: Failed to create plan - ${createError.message}`);
          console.error(`❌ Row ${index + 2}: Plan creation error:`, createError);
          continue;
        }

        // Cascade to staff
        try {
          const cascadeResult = await cascadeBranchPlan(plan);
          console.log(`✅ Row ${index + 2}: Plan cascaded successfully - ${cascadeResult.staffPlansCount} staff plans created`);
          results.created++;
        } catch (cascadeError) {
          // If cascade fails, delete the plan we just created
          console.error(`❌ Row ${index + 2}: Cascade failed, deleting plan ${plan._id}:`, cascadeError);
          await Plan.findByIdAndDelete(plan._id);
          results.errors.push(`Row ${index + 2}: Plan created but cascade failed - ${cascadeError.message}. Plan was rolled back.`);
        }
      } catch (error) {
        results.errors.push(`Row ${index + 2}: Unexpected error - ${error.message || 'Unknown error'}`);
        console.error(`❌ Row ${index + 2}: Unexpected error:`, error);
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
