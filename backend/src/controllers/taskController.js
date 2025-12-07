import DailyTask from '../models/DailyTask.js';
import AccountMapping from '../models/AccountMapping.js';
import JuneBalance from '../models/JuneBalance.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

// Helper: Build approval chain based on position
const buildApprovalChain = async (submitter) => {
  const chain = [];
  const submitterPosition = submitter.position;
  const branch_code = submitter.branch_code;

  // MSO → Accountant → MSM → Branch Manager
  if (['MSO I', 'MSO II', 'MSO III'].includes(submitterPosition)) {
    // Find Accountant in same branch
    const accountant = await User.findOne({
      branch_code,
      position: 'Accountant',
      isActive: true,
    });
    if (accountant) {
      chain.push({
        approverId: accountant._id,
        position: 'Accountant',
        status: 'Pending',
      });
    }

    // Find MSM in same branch
    const msm = await User.findOne({
      branch_code,
      position: 'MSM',
      isActive: true,
    });
    if (msm) {
      chain.push({
        approverId: msm._id,
        position: 'MSM',
        status: 'Pending',
      });
    }

    // Find Branch Manager
    const branchManager = await User.findOne({
      branch_code,
      position: 'Branch Manager',
      isActive: true,
    });
    if (branchManager) {
      chain.push({
        approverId: branchManager._id,
        position: 'Branch Manager',
        status: 'Pending',
      });
    }
  }
  // Accountant → MSM → Branch Manager
  else if (submitterPosition === 'Accountant') {
    const msm = await User.findOne({
      branch_code,
      position: 'MSM',
      isActive: true,
    });
    if (msm) {
      chain.push({
        approverId: msm._id,
        position: 'MSM',
        status: 'Pending',
      });
    }

    const branchManager = await User.findOne({
      branch_code,
      position: 'Branch Manager',
      isActive: true,
    });
    if (branchManager) {
      chain.push({
        approverId: branchManager._id,
        position: 'Branch Manager',
        status: 'Pending',
      });
    }
  }

  return chain;
};

// Helper: Check account mapping and June balance
const checkAccountMapping = async (accountNumber, userId, branch_code) => {
  const accountMapping = await AccountMapping.findOne({ accountNumber });
  const juneBalance = await JuneBalance.findOne({
    $or: [
      { account_id: accountNumber },
      { accountNumber: accountNumber },
    ],
    is_active: true, // Use active baseline
  });

  let mappingStatus;
  let canCountForKPI = false;

  if (!accountMapping) {
    mappingStatus = 'Unmapped';
    canCountForKPI = false;
  } else if (accountMapping.mappedTo.toString() === userId.toString()) {
    mappingStatus = 'Mapped to You';
    // Check if account has June balance and current balance ≥ 500
    if (accountMapping.current_balance >= 500) {
      canCountForKPI = true;
    }
  } else {
    mappingStatus = 'Mapped to Another Staff';
    canCountForKPI = false;
  }

  return {
    mappingStatus,
    canCountForKPI,
    accountMapping,
    juneBalance: juneBalance?.june_balance || 0,
  };
};

// Helper: Auto-map new account ≥ 500 ETB
const autoMapAccount = async (accountNumber, userId, branch_code, currentBalance) => {
  if (currentBalance < 500) {
    return null;
  }

  // Check if already mapped
  const existing = await AccountMapping.findOne({ accountNumber });
  if (existing) {
    return existing;
  }

  // Create new mapping
  const mapping = await AccountMapping.create({
    accountNumber,
    customerName: `Auto-mapped Account ${accountNumber}`,
    accountType: 'Savings', // Default, can be updated later
    current_balance: currentBalance,
    june_balance: 0, // New account, no June balance
    mappedTo: userId,
    branchId: branch_code, // Will need to convert to ObjectId if needed
    mappedBy: userId,
    status: 'Active',
  });

  return mapping;
};

// @desc    Create daily task
// @route   POST /api/tasks
// @access  Private
export const createTask = asyncHandler(async (req, res) => {
  const { taskType, productType, accountNumber, amount, remarks, evidence, taskDate } = req.body;

  // Only MSOs, Accountants, and Auditors can log tasks
  const allowedPositions = ['MSO I', 'MSO II', 'MSO III', 'Accountant', 'Auditor'];
  if (!allowedPositions.includes(req.user.position)) {
    return res.status(403).json({
      success: false,
      message: `Your position '${req.user.position}' cannot log tasks`,
    });
  }

  // Check account mapping
  const mappingCheck = await checkAccountMapping(
    accountNumber,
    req.user._id,
    req.user.branch_code
  );

  // Build approval chain based on position
  const approvalChain = await buildApprovalChain(req.user);

  const task = await DailyTask.create({
    taskType,
    productType,
    accountNumber,
    accountId: mappingCheck.accountMapping?._id,
    amount: amount || 0,
    remarks,
    evidence,
    submittedBy: req.user._id,
    branchId: req.user.branchId,
    mappingStatus: mappingCheck.mappingStatus,
    taskDate: taskDate || new Date(),
    approvalChain,
  });

  await logAudit(
    req.user._id,
    'Task Created',
    'Task',
    task._id,
    `Task ${taskType}`,
    `Created task for account ${accountNumber}`,
    req
  );

  res.status(201).json({
    success: true,
    data: task,
    mappingInfo: {
      status: mappingCheck.mappingStatus,
      canCountForKPI: mappingCheck.canCountForKPI,
    },
  });
});

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req, res) => {
  const { status, branchId, submittedBy, taskDate, approvalStatus } = req.query;
  
  const query = {};
  
  // Role-based filtering
  if (req.user.role === 'staff') {
    query.submittedBy = req.user._id;
  } else if (req.user.role === 'branchManager') {
    query.branchId = req.user.branchId;
  } else if (req.user.role === 'areaManager') {
    const branches = await Branch.find({ areaId: req.user.areaId });
    query.branchId = { $in: branches.map(b => b._id) };
  } else if (req.user.branch_code) {
    // Filter by branch_code for other roles
    const branch = await Branch.findOne({ code: req.user.branch_code });
    if (branch) {
      query.branchId = branch._id;
    }
  }

  if (status) query.mappingStatus = status;
  if (branchId) query.branchId = branchId;
  if (submittedBy) query.submittedBy = submittedBy;
  if (approvalStatus) query.approvalStatus = approvalStatus;
  if (taskDate) {
    const date = new Date(taskDate);
    query.taskDate = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999)),
    };
  }

  const tasks = await DailyTask.find(query)
    .populate('submittedBy', 'name employeeId role position')
    .populate('branchId', 'name code')
    .populate('accountId', 'accountNumber customerName')
    .populate('approvalChain.approverId', 'name position')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = asyncHandler(async (req, res) => {
  const task = await DailyTask.findById(req.params.id)
    .populate('submittedBy', 'name employeeId role position')
    .populate('branchId', 'name code')
    .populate('accountId', 'accountNumber customerName')
    .populate('approvalChain.approverId', 'name position');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  res.status(200).json({
    success: true,
    data: task,
  });
});

// @desc    Approve/Reject task
// @route   PUT /api/tasks/:id/approve
// @access  Private (Approvers)
export const approveTask = asyncHandler(async (req, res) => {
  const { status, comments } = req.body; // status: 'Approved' or 'Rejected'
  
  const task = await DailyTask.findById(req.params.id)
    .populate('submittedBy', 'name position branch_code sub_team');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  // Check if user can approve (must be in approval chain)
  const approvalIndex = task.approvalChain.findIndex(
    a => a.approverId && a.approverId.toString() === req.user._id.toString() && a.status === 'Pending'
  );

  if (approvalIndex === -1) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to approve this task',
    });
  }

  // Update approval chain
  task.approvalChain[approvalIndex].status = status;
  task.approvalChain[approvalIndex].approvedAt = new Date();
  task.approvalChain[approvalIndex].comments = comments;

  // Check if all approvals are done
  const allApproved = task.approvalChain.every(a => a.status === 'Approved');
  const anyRejected = task.approvalChain.some(a => a.status === 'Rejected');

  if (anyRejected) {
    task.approvalStatus = 'Rejected';
  } else if (allApproved) {
    task.approvalStatus = 'Approved';
    
    // Auto-map new account ≥ 500 ETB if unmapped
    if (task.mappingStatus === 'Unmapped') {
      // Get current balance from CBS (will be updated by CBS validation)
      // For now, check if we can auto-map based on task amount or account
      const accountMapping = await AccountMapping.findOne({ accountNumber: task.accountNumber });
      if (!accountMapping) {
        // Try to auto-map if account balance ≥ 500 (will be set during CBS validation)
        // This will be handled in CBS controller
      }
    }
  }

  await task.save();

  await logAudit(
    req.user._id,
    status === 'Approved' ? 'Task Approved' : 'Task Rejected',
    'Task',
    task._id,
    `Task ${task.taskType}`,
    `${status} task with comments: ${comments || 'No comments'}`,
    req
  );

  res.status(200).json({
    success: true,
    data: task,
  });
});
