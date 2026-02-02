import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

// Helper: Calculate behavioral score
const calculateBehavioralScore = (competencies) => {
  let totalScore = 0;
  const maxScore = 5; // Max score per competency

  Object.values(competencies).forEach(comp => {
    if (comp.score && comp.weight) {
      const normalizedScore = (comp.score / maxScore) * 100;
      totalScore += (normalizedScore * comp.weight) / 100;
    }
  });

  // Convert to 15% scale
  return (totalScore / 100) * 15;
};

// Helper: Build approval chain
const buildBehavioralApprovalChain = (user) => {
  const chain = [];

  if (user.role === 'subTeamLeader' || user.role === 'lineManager') {
    chain.push({ role: 'Branch Manager', status: 'Pending' });
  }

  if (user.role === 'branchManager') {
    chain.push({ role: 'Area Manager', status: 'Pending' });
  }

  return chain;
};

// @desc    Create behavioral evaluation
// @route   POST /api/behavioral
// @access  Private (Supervisors)
export const createBehavioralEvaluation = asyncHandler(async (req, res) => {
  const { evaluatedUserId, period, year, month, quarter, competencies, overallComments } = req.body;

  const totalScore = calculateBehavioralScore(competencies);
  const approvalChainData = buildBehavioralApprovalChain(req.user);

  const evaluation = await prisma.$transaction(async (tx) => {
    const newEval = await tx.behavioralEvaluation.create({
      data: {
        evaluatedUserId,
        evaluatedById: req.user.id,
        branchId: req.user.branchId,
        period,
        year: parseInt(year),
        month: month ? parseInt(month) : null,
        quarter: quarter ? parseInt(quarter) : null,
        competencies,
        totalScore,
        overallComments,
        approvalStatus: 'Draft'
      }
    });

    if (approvalChainData.length > 0) {
      await tx.evaluationApproval.createMany({
        data: approvalChainData.map(a => ({
          evaluationId: newEval.id,
          approverId: req.user.id, // This needs proper logic to find the NEXT approver
          role: a.role,
          status: 'Pending'
        }))
      });
    }

    return newEval;
  });

  await logAudit(
    req.user.id,
    'Behavioral Evaluation',
    'Evaluation',
    evaluation.id,
    `Behavioral Evaluation`,
    `Created behavioral evaluation`,
    req
  );

  res.status(201).json({
    success: true,
    data: { ...evaluation, _id: evaluation.id },
  });
});

// @desc    Get behavioral evaluations
// @route   GET /api/behavioral
// @access  Private
export const getBehavioralEvaluations = asyncHandler(async (req, res) => {
  const { evaluatedUserId, branchId, period, year, approvalStatus } = req.query;

  const where = {};

  if (req.user.role === 'staff') {
    where.evaluatedUserId = req.user.id;
  } else if (evaluatedUserId) {
    where.evaluatedUserId = evaluatedUserId;
  }

  if (branchId) where.branchId = branchId;
  else if (req.user.branchId) where.branchId = req.user.branchId;

  if (period) where.period = period;
  if (year) where.year = parseInt(year);
  if (approvalStatus) where.approvalStatus = approvalStatus;

  const evaluations = await prisma.behavioralEvaluation.findMany({
    where,
    include: {
      evaluatedUser: { select: { id: true, name: true, employeeId: true, role: true } },
      evaluatedBy: { select: { id: true, name: true, role: true } },
      branch: { select: { id: true, name: true, code: true } },
      approvalChain: { include: { approver: { select: { id: true, name: true } } } }
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    count: evaluations.length,
    data: evaluations.map(e => ({
      ...e,
      _id: e.id,
      evaluatedUserId: e.evaluatedUser ? { ...e.evaluatedUser, _id: e.evaluatedUser.id } : null,
      evaluatedBy: e.evaluatedBy ? { ...e.evaluatedBy, _id: e.evaluatedBy.id } : null,
      branchId: e.branch ? { ...e.branch, _id: e.branch.id } : null,
    })),
  });
});

// @desc    Approve behavioral evaluation
// @route   PUT /api/behavioral/:id/approve
// @access  Private (Approvers)
export const approveBehavioralEvaluation = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;

  const evaluation = await prisma.behavioralEvaluation.findUnique({
    where: { id: req.params.id },
    include: { approvalChain: true }
  });

  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found',
    });
  }

  // Find the exact approval record for this user
  const approval = evaluation.approvalChain.find(
    a => a.approverId === req.user.id && a.status === 'Pending'
  );

  // If no specific record, check by role for this branch (simplified)
  // In a real system, there would be a more complex mapping

  await prisma.$transaction(async (tx) => {
    if (approval) {
      await tx.evaluationApproval.update({
        where: { id: approval.id },
        data: {
          status: status,
          approvedAt: new Date(),
          comments,
        }
      });
    }

    // Check if evaluation is finalized
    const updatedChain = await tx.evaluationApproval.findMany({ where: { evaluationId: evaluation.id } });
    const allApproved = updatedChain.every(a => a.status === 'Approved');

    let updateData = { approvalStatus: status };
    if (allApproved && status === 'Approved') {
      updateData.approvalStatus = 'Approved';
      updateData.isLocked = true;
      updateData.lockedAt = new Date();
    } else if (status === 'Rejected') {
      updateData.approvalStatus = 'Rejected';
    } else {
      updateData.approvalStatus = 'Pending';
    }

    await tx.behavioralEvaluation.update({
      where: { id: evaluation.id },
      data: updateData
    });
  });

  await logAudit(
    req.user.id,
    'Approval',
    'Evaluation',
    evaluation.id,
    'Behavioral Evaluation',
    `${status} behavioral evaluation`,
    req
  );

  const finalEval = await prisma.behavioralEvaluation.findUnique({
    where: { id: req.params.id },
    include: { approvalChain: true }
  });

  res.status(200).json({
    success: true,
    data: { ...finalEval, _id: finalEval.id },
  });
});
