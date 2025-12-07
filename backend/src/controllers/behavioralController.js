import BehavioralEvaluation from '../models/BehavioralEvaluation.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Create behavioral evaluation
// @route   POST /api/behavioral
// @access  Private (Supervisors)
export const createBehavioralEvaluation = asyncHandler(async (req, res) => {
  const { evaluatedUserId, period, year, month, quarter, competencies, overallComments } = req.body;

  // Calculate total score
  const totalScore = calculateBehavioralScore(competencies);

  // Build approval chain
  const approvalChain = buildBehavioralApprovalChain(req.user);

  const evaluation = await BehavioralEvaluation.create({
    evaluatedUserId,
    evaluatedBy: req.user._id,
    branchId: req.user.branchId,
    period,
    year,
    month,
    quarter,
    competencies,
    totalScore,
    overallComments,
    approvalChain,
  });

  await logAudit(
    req.user._id,
    'Behavioral Evaluation',
    'Evaluation',
    evaluation._id,
    `Behavioral Evaluation`,
    `Created behavioral evaluation`,
    req
  );

  res.status(201).json({
    success: true,
    data: evaluation,
  });
});

// @desc    Get behavioral evaluations
// @route   GET /api/behavioral
// @access  Private
export const getBehavioralEvaluations = asyncHandler(async (req, res) => {
  const { evaluatedUserId, branchId, period, year, approvalStatus } = req.query;
  
  const query = {};
  
  if (req.user.role === 'Staff / MSO') {
    query.evaluatedUserId = req.user._id;
  } else if (evaluatedUserId) {
    query.evaluatedUserId = evaluatedUserId;
  }

  if (branchId) query.branchId = branchId;
  else if (req.user.branchId) query.branchId = req.user.branchId;

  if (period) query.period = period;
  if (year) query.year = parseInt(year);
  if (approvalStatus) query.approvalStatus = approvalStatus;

  const evaluations = await BehavioralEvaluation.find(query)
    .populate('evaluatedUserId', 'name employeeId role')
    .populate('evaluatedBy', 'name role')
    .populate('branchId', 'name code')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: evaluations.length,
    data: evaluations,
  });
});

// @desc    Approve behavioral evaluation
// @route   PUT /api/behavioral/:id/approve
// @access  Private (Approvers)
export const approveBehavioralEvaluation = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;
  
  const evaluation = await BehavioralEvaluation.findById(req.params.id);

  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found',
    });
  }

  // Update approval chain
  const approvalIndex = evaluation.approvalChain.findIndex(
    a => a.approverId?.toString() === req.user._id.toString() && a.status === 'Pending'
  );

  if (approvalIndex !== -1) {
    evaluation.approvalChain[approvalIndex].status = status;
    evaluation.approvalChain[approvalIndex].approvedAt = new Date();
    evaluation.approvalChain[approvalIndex].comments = comments;
  }

  // Check if all approvals done
  const allApproved = evaluation.approvalChain.every(a => a.status === 'Approved');
  if (allApproved) {
    evaluation.approvalStatus = 'Approved';
    evaluation.isLocked = true;
    evaluation.lockedAt = new Date();
  } else if (status === 'Rejected') {
    evaluation.approvalStatus = 'Rejected';
  }

  await evaluation.save();

  await logAudit(
    req.user._id,
    'Approval',
    'Evaluation',
    evaluation._id,
    'Behavioral Evaluation',
    `${status} behavioral evaluation`,
    req
  );

  res.status(200).json({
    success: true,
    data: evaluation,
  });
});

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
  
  if (user.role === 'Sub-Team Leader' || user.role === 'Line Manager') {
    chain.push({ role: 'Branch Manager', status: 'Pending' });
  }
  
  if (user.role === 'Branch Manager') {
    chain.push({ role: 'Area Manager', status: 'Pending' });
  }
  
  return chain;
};

