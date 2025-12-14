import StaffPlan from '../models/StaffPlan.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

// @desc    Get all staff plans
// @route   GET /api/staff-plans
// @access  Private
export const getStaffPlans = asyncHandler(async (req, res) => {
  const { userId, branch_code, kpi_category, period, branchPlanId } = req.query;
  
  const query = {};
  
  // Role-based filtering
  if (req.user.role === 'admin' || req.user.role === 'SAKO HQ / Admin') {
    // Admin can see all
  } else if (req.user.role === 'branchManager' || req.user.role === 'lineManager') {
    // Branch Manager and Line Manager see plans for their branch
    query.branch_code = req.user.branch_code || req.user.branchId?.code;
  } else {
    // Staff see only their own plans
    query.userId = req.user._id;
  }
  
  // Apply additional filters
  if (userId) query.userId = userId;
  if (branch_code) query.branch_code = branch_code;
  if (kpi_category) query.kpi_category = kpi_category;
  if (period) query.period = period;
  if (branchPlanId) query.branchPlanId = branchPlanId;

  const staffPlans = await StaffPlan.find(query)
    .populate('userId', 'name email position employeeId')
    .populate('branchPlanId', 'branch_code kpi_category period target_value')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: staffPlans.length,
    data: staffPlans,
  });
});

// @desc    Get single staff plan
// @route   GET /api/staff-plans/:id
// @access  Private
export const getStaffPlan = asyncHandler(async (req, res) => {
  const staffPlan = await StaffPlan.findById(req.params.id)
    .populate('userId', 'name email position employeeId')
    .populate('branchPlanId', 'branch_code kpi_category period target_value');

  if (!staffPlan) {
    return res.status(404).json({
      success: false,
      message: 'Staff plan not found',
    });
  }

  // Check authorization
  if (req.user.role !== 'admin' && 
      req.user.role !== 'SAKO HQ / Admin' && 
      req.user.role !== 'branchManager' &&
      staffPlan.userId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this staff plan',
    });
  }

  res.status(200).json({
    success: true,
    data: staffPlan,
  });
});



