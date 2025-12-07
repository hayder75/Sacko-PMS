import PerformanceScore from '../models/PerformanceScore.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { calculateKPIScore, calculateRating } from '../utils/performanceCalculator.js';
import BehavioralEvaluation from '../models/BehavioralEvaluation.js';

// @desc    Calculate performance score
// @route   POST /api/performance/calculate
// @access  Private
export const calculatePerformance = asyncHandler(async (req, res) => {
  const { userId, period } = req.body;
  const targetUserId = userId || req.user._id;
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
  const behavioralEval = await BehavioralEvaluation.findOne({
    evaluatedUserId: targetUserId,
    period,
    approvalStatus: 'Approved',
  });

  const behavioralScore = behavioralEval?.totalScore || 0;

  // Calculate final score
  const finalScore = kpiResult.kpiTotalScore + behavioralScore;
  const rating = calculateRating(finalScore);

  // Save or update performance score
  const performanceScore = await PerformanceScore.findOneAndUpdate(
    {
      userId: targetUserId,
      period,
    },
    {
      userId: targetUserId,
      branchId: req.user.branchId,
      period,
      kpiScores: kpiResult.kpiScores,
      kpiTotalScore: kpiResult.kpiTotalScore,
      behavioralScore,
      behavioralEvaluationId: behavioralEval?._id,
      finalScore,
      rating,
      status: 'Calculated',
    },
    {
      new: true,
      upsert: true,
    }
  );

  res.status(200).json({
    success: true,
    data: performanceScore,
  });
});

// @desc    Get performance scores
// @route   GET /api/performance
// @access  Private
export const getPerformanceScores = asyncHandler(async (req, res) => {
  const { userId, branchId, period } = req.query;
  
  const query = {};
  
  // Role-based filtering
  if (req.user.role === 'staff') {
    query.userId = req.user._id;
  } else if (userId) {
    query.userId = userId;
  } else if (branchId) {
    query.branchId = branchId;
  } else if (req.user.branchId) {
    query.branchId = req.user.branchId;
  }

  if (period) query.period = period;

  const scores = await PerformanceScore.find(query)
    .populate('userId', 'name employeeId role position')
    .populate('branchId', 'name code')
    .sort({ createdAt: -1 });

  // If single score requested, add chart data for KPIDashboard
  if (scores.length === 1) {
    const score = scores[0];
    
    // Get daily data (last 30 days)
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayTasks = await DailyTask.find({
        submittedBy: score.userId,
        taskDate: { $gte: date, $lt: nextDate },
        approvalStatus: 'Approved',
      });
      
      const dayAchievement = dayTasks.reduce((sum, task) => sum + (task.amount || 0), 0);
      dailyData.push({
        day: i + 1,
        target: 100, // Would need plan data
        achievement: dayAchievement,
      });
    }

    // Get KPI contribution data
    const kpiScores = score.kpiScores || {};
    const kpiContribution = [
      { category: 'Deposit', value: kpiScores.deposit?.percent || 0 },
      { category: 'Digital', value: kpiScores.digital?.percent || 0 },
      { category: 'Loan', value: kpiScores.loan?.percent || 0 },
      { category: 'Customer', value: kpiScores.customer?.percent || 0 },
      { category: 'Member', value: kpiScores.member?.percent || 0 },
    ];

    // Get radar chart data
    const radarData = [
      { subject: 'Deposit', A: kpiScores.deposit?.percent || 0, fullMark: 100 },
      { subject: 'Digital', A: kpiScores.digital?.percent || 0, fullMark: 100 },
      { subject: 'Loan', A: kpiScores.loan?.percent || 0, fullMark: 100 },
      { subject: 'Customer', A: kpiScores.customer?.percent || 0, fullMark: 100 },
      { subject: 'Member', A: kpiScores.member?.percent || 0, fullMark: 100 },
      { subject: 'Behavioral', A: score.behavioralScore || 0, fullMark: 100 },
    ];

    // Add chart data to first score
    const scoreWithCharts = {
      ...score.toObject(),
      dailyData,
      kpiContribution,
      radarData,
    };

    return res.status(200).json({
      success: true,
      count: 1,
      data: [scoreWithCharts],
    });
  }

  res.status(200).json({
    success: true,
    count: scores.length,
    data: scores,
  });
});

// @desc    Get single performance score
// @route   GET /api/performance/:id
// @access  Private
export const getPerformanceScore = asyncHandler(async (req, res) => {
  const score = await PerformanceScore.findById(req.params.id)
    .populate('userId', 'name employeeId role')
    .populate('branchId', 'name code')
    .populate('behavioralEvaluationId');

  if (!score) {
    return res.status(404).json({
      success: false,
      message: 'Performance score not found',
    });
  }

  res.status(200).json({
    success: true,
    data: score,
  });
});

