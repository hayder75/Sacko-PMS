import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { calculateKPIScore, calculateRating } from '../utils/performanceCalculator.js';

// @desc    Calculate performance score
// @route   POST /api/performance/calculate
// @access  Private
export const calculatePerformance = asyncHandler(async (req, res) => {
  const { userId, period } = req.body;
  const targetUserId = userId || req.user.id;
  const branch_code = req.user.branch_code;

  if (!period) {
    return res.status(400).json({
      success: false,
      message: 'Period is required',
    });
  }

  // Calculate KPI score
  const kpiResult = await calculateKPIScore(
    targetUserId,
    branch_code,
    period
  );

  // Get behavioral score (15% weight)
  const behavioralEval = await prisma.behavioralEvaluation.findFirst({
    where: {
      evaluatedUserId: targetUserId,
      period,
      approvalStatus: 'Approved',
    },
  });

  const behavioralScore = behavioralEval?.totalScore || 0;

  // Calculate final score
  const finalScore = kpiResult.kpiTotalScore + behavioralScore;
  const ratingEnum = calculateRating(finalScore);

  // Find user and branch
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });

  // Update or create performance score
  const performanceScore = await prisma.performanceScore.upsert({
    where: {
      userId_period_year_month: { // Assuming we have such a compound unique constraint or we search first
        userId: targetUserId,
        period: period, // This depends on how period is defined in Prisma schema
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      }
    },
    // Since unique constraint is complex, we might want to use findFirst + update/create
    // Let's use a simpler findFirst + create/update for now as upsert needs a unique index
    create: {
      userId: targetUserId,
      branchId: user.branchId,
      period,
      year: new Date().getFullYear(),
      kpiScores: kpiResult.kpiScores,
      kpiTotalScore: kpiResult.kpiTotalScore,
      behavioralScore,
      behavioralEvaluationId: behavioralEval?.id || null,
      finalScore,
      rating: ratingEnum,
      status: 'Calculated',
    },
    update: {
      kpiScores: kpiResult.kpiScores,
      kpiTotalScore: kpiResult.kpiTotalScore,
      behavioralScore,
      behavioralEvaluationId: behavioralEval?.id || null,
      finalScore,
      rating: ratingEnum,
      status: 'Calculated',
      updatedAt: new Date(),
    }
  });

  res.status(200).json({
    success: true,
    data: { ...performanceScore, _id: performanceScore.id },
  });
});

// Since upsert above might fail if the compound index isn't EXACTLY matching, 
// let's provide a safer implementation for calculatePerformance

export const safeCalculatePerformance = asyncHandler(async (req, res) => {
  const { userId, period } = req.body;
  const targetUserId = userId || req.user.id;
  const branch_code = req.user.branch_code;

  if (!period) {
    return res.status(400).json({
      success: false,
      message: 'Period is required',
    });
  }

  // Calculate KPI score
  const kpiResult = await calculateKPIScore(targetUserId, branch_code, period);

  // Get behavioral score (15% weight)
  const behavioralEval = await prisma.behavioralEvaluation.findFirst({
    where: {
      evaluatedUserId: targetUserId,
      period,
      approvalStatus: 'Approved',
    },
  });

  const behavioralScore = behavioralEval?.totalScore || 0;
  const finalScore = kpiResult.kpiTotalScore + behavioralScore;
  const ratingEnum = calculateRating(finalScore);

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });

  const existingScore = await prisma.performanceScore.findFirst({
    where: {
      userId: targetUserId,
      period: period,
    }
  });

  let performanceScore;
  if (existingScore) {
    performanceScore = await prisma.performanceScore.update({
      where: { id: existingScore.id },
      data: {
        kpiScores: kpiResult.kpiScores,
        kpiTotalScore: kpiResult.kpiTotalScore,
        behavioralScore,
        behavioralEvaluationId: behavioralEval?.id || null,
        finalScore,
        rating: ratingEnum,
        status: 'Calculated',
      }
    });
  } else {
    performanceScore = await prisma.performanceScore.create({
      data: {
        userId: targetUserId,
        branchId: user.branchId,
        period,
        year: new Date().getFullYear(),
        kpiScores: kpiResult.kpiScores,
        kpiTotalScore: kpiResult.kpiTotalScore,
        behavioralScore,
        behavioralEvaluationId: behavioralEval?.id || null,
        finalScore,
        rating: ratingEnum,
        status: 'Calculated',
      }
    });
  }

  res.status(200).json({
    success: true,
    data: { ...performanceScore, _id: performanceScore.id },
  });
});

// @desc    Get performance scores
// @route   GET /api/performance
// @access  Private
export const getPerformanceScores = asyncHandler(async (req, res) => {
  const { userId, branchId, period } = req.query;

  const where = {};

  if (req.user.role === 'staff') {
    where.userId = req.user.id;
  } else if (userId) {
    where.userId = userId;
  } else if (branchId) {
    where.branchId = branchId;
  } else if (req.user.branchId) {
    where.branchId = req.user.branchId;
  }

  if (period) where.period = period;

  const scores = await prisma.performanceScore.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, employeeId: true, role: true, position: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Backward compatibility mapping
  const mappedScores = scores.map(s => ({
    ...s,
    _id: s.id,
    userId: s.user ? { ...s.user, _id: s.user.id } : null,
    branchId: s.branch ? { ...s.branch, _id: s.branch.id } : null,
  }));

  res.status(200).json({
    success: true,
    count: mappedScores.length,
    data: mappedScores,
  });
});

// @desc    Get single performance score
// @route   GET /api/performance/:id
// @access  Private
export const getPerformanceScore = asyncHandler(async (req, res) => {
  const score = await prisma.performanceScore.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, employeeId: true, role: true } },
      branch: { select: { id: true, name: true, code: true } },
      behavioralEvaluation: true,
    },
  });

  if (!score) {
    return res.status(404).json({
      success: false,
      message: 'Performance score not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...score,
      _id: score.id,
      userId: score.user ? { ...score.user, _id: score.user.id } : null,
      branchId: score.branch ? { ...score.branch, _id: score.branch.id } : null,
    },
  });
});
