import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { TASK_TYPE_TO_ENUM, MAPPING_STATUS_TO_ENUM, APPROVAL_STATUS_TO_ENUM, APPROVAL_STATUS_MAP } from '../utils/prismaHelpers.js';

// Helper: Build approval chain based on position
const buildApprovalChain = async (submitter) => {
  const chain = [];
  const submitterPosition = submitter.position;
  const branch_code = submitter.branch_code;

  // MSO → Accountant → MSM → Branch Manager
  if (['Member_Service_Officer_I', 'Member_Service_Officer_II', 'Member_Service_Officer_III'].includes(submitterPosition)) {
    // Find Accountant in same branch
    const accountant = await prisma.user.findFirst({
      where: {
        branch_code,
        position: 'Accountant',
        isActive: true,
      }
    });
    if (accountant) {
      chain.push({
        approverId: accountant.id,
        role: 'Accountant',
        status: 'Pending',
      });
    }

    // Find MSM in same branch
    const msm = await prisma.user.findFirst({
      where: {
        branch_code,
        position: 'Member_Service_Manager',
        isActive: true,
      }
    });
    if (msm) {
      chain.push({
        approverId: msm.id,
        role: 'Member Service Manager (MSM)',
        status: 'Pending',
      });
    }

    // Find Branch Manager
    const branchManager = await prisma.user.findFirst({
      where: {
        branch_code,
        position: 'Branch_Manager',
        isActive: true,
      }
    });
    if (branchManager) {
      chain.push({
        approverId: branchManager.id,
        role: 'Branch Manager',
        status: 'Pending',
      });
    }
  }
  // Accountant → MSM → Branch Manager
  else if (submitterPosition === 'Accountant') {
    const msm = await prisma.user.findFirst({
      where: {
        branch_code,
        position: 'Member_Service_Manager',
        isActive: true,
      }
    });
    if (msm) {
      chain.push({
        approverId: msm.id,
        role: 'Member Service Manager (MSM)',
        status: 'Pending',
      });
    }

    const branchManager = await prisma.user.findFirst({
      where: {
        branch_code,
        position: 'Branch_Manager',
        isActive: true,
      }
    });
    if (branchManager) {
      chain.push({
        approverId: branchManager.id,
        role: 'Branch Manager',
        status: 'Pending',
      });
    }
  }

  return chain;
};

// Helper: Check account mapping and June balance
const checkAccountMapping = async (accountNumber, userId, branch_code) => {
  const accountMapping = await prisma.accountMapping.findUnique({
    where: { accountNumber }
  });

  const juneBalance = await prisma.juneBalance.findFirst({
    where: {
      OR: [
        { account_id: accountNumber },
        { accountNumber: accountNumber },
      ],
      is_active: true,
    },
  });

  let mappingStatus;
  let canCountForKPI = false;

  if (!accountMapping) {
    mappingStatus = 'Unmapped';
    canCountForKPI = false;
  } else if (accountMapping.mappedToId === userId) {
    mappingStatus = 'Mapped to You';
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

// @desc    Create daily task
// @route   POST /api/tasks
// @access  Private
export const createTask = asyncHandler(async (req, res) => {
  const { taskType, productType, accountNumber, amount, remarks, evidence, taskDate } = req.body;

  const allowedPositions = ['Member_Service_Officer_I', 'Member_Service_Officer_II', 'Member_Service_Officer_III', 'Accountant'];
  if (!allowedPositions.includes(req.user.position)) {
    return res.status(403).json({
      success: false,
      message: `Your position '${req.user.position}' cannot log tasks`,
    });
  }

  const mappingCheck = await checkAccountMapping(
    accountNumber,
    req.user.id,
    req.user.branch_code
  );

  const approvalChainData = await buildApprovalChain(req.user);

  // We use a transaction because we need to create the task and then the approval chain records
  const task = await prisma.$transaction(async (tx) => {
    const newTask = await tx.dailyTask.create({
      data: {
        taskType: TASK_TYPE_TO_ENUM[taskType] || taskType,
        productType,
        accountNumber,
        accountId: mappingCheck.accountMapping?.id || null,
        amount: amount || 0,
        remarks,
        evidence,
        submittedById: req.user.id,
        branchId: req.user.branchId,
        mappingStatus: MAPPING_STATUS_TO_ENUM[mappingCheck.mappingStatus],
        taskDate: taskDate ? new Date(taskDate) : new Date(),
        approvalStatus: 'Pending',
      },
    });

    if (approvalChainData.length > 0) {
      await tx.taskApproval.createMany({
        data: approvalChainData.map(a => ({
          taskId: newTask.id,
          approverId: a.approverId,
          role: a.role,
          status: 'Pending',
        })),
      });
    }

    return newTask;
  });

  await logAudit(
    req.user.id,
    'Task Created',
    'Task',
    task.id,
    `Task ${taskType}`,
    `Created task for account ${accountNumber}`,
    req
  );

  res.status(201).json({
    success: true,
    data: { ...task, _id: task.id },
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

  const where = {};

  if (req.user.role === 'staff') {
    where.submittedById = req.user.id;
  } else if (req.user.role === 'branchManager') {
    where.branchId = req.user.branchId;
  } else if (req.user.role === 'areaManager') {
    const branches = await prisma.branch.findMany({ where: { areaId: req.user.areaId }, select: { id: true } });
    where.branchId = { in: branches.map(b => b.id) };
  } else if (req.user.branch_code) {
    const branch = await prisma.branch.findUnique({ where: { code: req.user.branch_code } });
    if (branch) where.branchId = branch.id;
  }

  if (status) where.mappingStatus = MAPPING_STATUS_TO_ENUM[status] || status;
  if (branchId) where.branchId = branchId;
  if (submittedBy) where.submittedById = submittedBy;
  if (approvalStatus) where.approvalStatus = APPROVAL_STATUS_TO_ENUM[approvalStatus] || approvalStatus;

  if (taskDate) {
    const date = new Date(taskDate);
    where.taskDate = {
      gte: new Date(date.setHours(0, 0, 0, 0)),
      lt: new Date(date.setHours(23, 59, 59, 999)),
    };
  }

  const tasks = await prisma.dailyTask.findMany({
    where,
    include: {
      submittedBy: { select: { id: true, name: true, employeeId: true, role: true, position: true } },
      branch: { select: { id: true, name: true, code: true } },
      account: { select: { id: true, accountNumber: true, customerName: true } },
      approvalChain: { include: { approver: { select: { id: true, name: true, position: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks.map(t => ({
      ...t,
      _id: t.id,
      submittedBy: { ...t.submittedBy, _id: t.submittedBy.id },
      branchId: { ...t.branch, _id: t.branch.id },
      accountId: t.account ? { ...t.account, _id: t.account.id } : null,
      approvalChain: t.approvalChain.map(a => ({
        ...a,
        _id: a.id,
        approverId: { ...a.approver, _id: a.approver.id }
      }))
    })),
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = asyncHandler(async (req, res) => {
  const task = await prisma.dailyTask.findUnique({
    where: { id: req.params.id },
    include: {
      submittedBy: { select: { id: true, name: true, employeeId: true, role: true, position: true } },
      branch: { select: { id: true, name: true, code: true } },
      account: { select: { id: true, accountNumber: true, customerName: true } },
      approvalChain: { include: { approver: { select: { id: true, name: true, position: true } } } },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...task,
      _id: task.id,
      submittedBy: { ...task.submittedBy, _id: task.submittedBy.id },
      branchId: { ...task.branch, _id: task.branch.id },
      accountId: task.account ? { ...task.account, _id: task.account.id } : null,
      approvalChain: task.approvalChain.map(a => ({
        ...a,
        _id: a.id,
        approverId: { ...a.approver, _id: a.approver.id }
      }))
    },
  });
});

// @desc    Approve/Reject task
// @route   PUT /api/tasks/:id/approve
// @access  Private (Approvers)
export const approveTask = asyncHandler(async (req, res) => {
  const { status, comments } = req.body; // status: 'Approved' or 'Rejected'
  const statusEnum = APPROVAL_STATUS_TO_ENUM[status] || status;

  const task = await prisma.dailyTask.findUnique({
    where: { id: req.params.id },
    include: { approvalChain: true }
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  const approval = task.approvalChain.find(
    a => a.approverId === req.user.id && a.status === 'Pending'
  );

  if (!approval) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to approve this task',
    });
  }

  // Update this approval entry and task status
  await prisma.$transaction(async (tx) => {
    await tx.taskApproval.update({
      where: { id: approval.id },
      data: {
        status: statusEnum,
        approvedAt: new Date(),
        comments,
      }
    });

    const updatedChain = await tx.taskApproval.findMany({ where: { taskId: task.id } });

    const allApproved = updatedChain.every(a => a.status === 'Approved');
    const anyRejected = updatedChain.some(a => a.status === 'Rejected');

    let newTaskStatus = 'Pending';
    if (anyRejected) newTaskStatus = 'Rejected';
    else if (allApproved) newTaskStatus = 'Approved';

    await tx.dailyTask.update({
      where: { id: task.id },
      data: { approvalStatus: newTaskStatus }
    });
  });

  await logAudit(
    req.user.id,
    status === 'Approved' ? 'Task Approved' : 'Task Rejected',
    'Task',
    task.id,
    `Task ${task.taskType}`,
    `${status} task with comments: ${comments || 'No comments'}`,
    req
  );

  const finalTask = await prisma.dailyTask.findUnique({
    where: { id: req.params.id },
    include: { approvalChain: true }
  });

  res.status(200).json({
    success: true,
    data: { ...finalTask, _id: finalTask.id },
  });
});
