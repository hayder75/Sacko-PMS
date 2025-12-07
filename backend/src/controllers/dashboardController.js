import { asyncHandler } from '../middleware/asyncHandler.js';
import PerformanceScore from '../models/PerformanceScore.js';
import DailyTask from '../models/DailyTask.js';
import AccountMapping from '../models/AccountMapping.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import CBSValidation from '../models/CBSValidation.js';
import StaffPlan from '../models/StaffPlan.js';
import Area from '../models/Area.js';
import { calculateIncrementalGrowth } from '../utils/performanceCalculator.js';

// @desc    Get HQ Dashboard data
// @route   GET /api/dashboard/hq
// @access  Private (HQ Admin)
export const getHQDashboard = asyncHandler(async (req, res) => {
  const totalBranches = await Branch.countDocuments({ isActive: true });
  const totalStaff = await User.countDocuments({ isActive: true, role: 'Staff / MSO' });
  
  // Get average plan achievement
  const performanceScores = await PerformanceScore.find({
    period: 'Monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  
  const avgPlanAchievement = performanceScores.length > 0
    ? performanceScores.reduce((sum, score) => sum + score.finalScore, 0) / performanceScores.length
    : 0;

  // Get CBS validation rate
  const recentValidations = await CBSValidation.find({
    validationDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  });
  
  const cbsValidationRate = recentValidations.length > 0
    ? (recentValidations.filter(v => v.status === 'Completed').length / recentValidations.length) * 100
    : 0;

  // Get branch performance data for heatmap and charts
  const branches = await Branch.find({ isActive: true })
    .populate('managerId', 'name')
    .populate('regionId', 'name')
    .populate('areaId', 'name');
  
  const branchPerformance = await Promise.all(
    branches.map(async (branch) => {
      const branchScores = await PerformanceScore.find({
        branchId: branch._id,
        period: 'Monthly',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      }).populate('userId', 'name');

      const avgScore = branchScores.length > 0
        ? branchScores.reduce((sum, s) => sum + s.finalScore, 0) / branchScores.length
        : 0;

      // Get KPI breakdown for this branch
      const kpiScores = branchScores.length > 0 
        ? branchScores[0].kpiScores || {}
        : {};

      return {
        branchId: branch._id,
        branch: branch.name,
        branchName: branch.name,
        region: branch.regionId?.name || 'N/A',
        area: branch.areaId?.name || 'N/A',
        averageScore: avgScore,
        deposit: kpiScores.deposit?.percent || 0,
        digital: kpiScores.digital?.percent || 0,
        loan: kpiScores.loan?.percent || 0,
        customer: kpiScores.customer?.percent || 0,
      };
    })
  );

  // Calculate performance distribution
  const performanceDistribution = [
    { rating: 'Outstanding', count: performanceScores.filter(s => s.finalScore >= 90).length },
    { rating: 'Very Good', count: performanceScores.filter(s => s.finalScore >= 80 && s.finalScore < 90).length },
    { rating: 'Good', count: performanceScores.filter(s => s.finalScore >= 70 && s.finalScore < 80).length },
    { rating: 'Needs Support', count: performanceScores.filter(s => s.finalScore >= 60 && s.finalScore < 70).length },
    { rating: 'Unsatisfactory', count: performanceScores.filter(s => s.finalScore < 60).length },
  ];

  // Get top 5 and bottom 5 branches
  const sortedBranches = [...branchPerformance].sort((a, b) => b.averageScore - a.averageScore);
  const topBranches = sortedBranches.slice(0, 5).map(b => ({
    branch: b.branchName,
    name: b.branchName,
    region: b.region,
    depositTarget: 0, // Would need plan data
    actual: 0,
    percent: Math.round(b.averageScore),
    rating: b.averageScore >= 90 ? 'Outstanding' : b.averageScore >= 80 ? 'Very Good' : b.averageScore >= 70 ? 'Good' : 'Needs Support',
  }));
  
  const bottomBranches = sortedBranches.slice(-5).reverse().map(b => ({
    branch: b.branchName,
    name: b.branchName,
    region: b.region,
    depositTarget: 0,
    actual: 0,
    percent: Math.round(b.averageScore),
    rating: b.averageScore >= 90 ? 'Outstanding' : b.averageScore >= 80 ? 'Very Good' : b.averageScore >= 70 ? 'Good' : 'Needs Support',
  }));

  // Get recent activity (from audit logs - simplified for now)
  const activityFeed = [];

  res.status(200).json({
    success: true,
    data: {
      totalBranches,
      totalStaff,
      avgPlanAchievement: Math.round(avgPlanAchievement * 100) / 100,
      cbsValidationRate: Math.round(cbsValidationRate * 100) / 100,
      branchKPIHeatmap: branchPerformance,
      branchPerformance,
      performanceDistribution,
      topBranches,
      bottomBranches,
      activityFeed,
    },
  });
});

// @desc    Get Regional Director Dashboard
// @route   GET /api/dashboard/regional
// @access  Private (Regional Director)
export const getRegionalDashboard = asyncHandler(async (req, res) => {
  // Get all branches in the region
  const branches = await Branch.find({
    regionId: req.user.regionId,
    isActive: true,
  }).populate('areaId', 'name').populate('managerId', 'name');

  const branchCount = branches.length;
  
  // Get area managers in region
  const areaManagers = await User.find({
    regionId: req.user.regionId,
    role: 'areaManager',
    isActive: true,
  });

  // Calculate average branch achievement
  const branchScores = await PerformanceScore.find({
    branchId: { $in: branches.map(b => b._id) },
    period: 'Monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const avgBranchAchievement = branchScores.length > 0
    ? branchScores.reduce((sum, s) => sum + s.finalScore, 0) / branchScores.length
    : 0;

  // Get mapping coverage
  const totalMappings = await AccountMapping.countDocuments({
    branchId: { $in: branches.map(b => b._id) },
  });

  // Get top 5 and bottom 5 branches by performance
  const branchPerformance = await Promise.all(
    branches.map(async (branch) => {
      const score = await PerformanceScore.findOne({
        branchId: branch._id,
        period: 'Monthly',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });
      return {
        id: branch._id,
        name: branch.name,
        area: branch.areaId?.name || 'N/A',
        achievement: score ? Math.round(score.finalScore * 100) / 100 : 0,
        status: score ? (score.finalScore >= 80 ? 'Good' : score.finalScore >= 60 ? 'Warning' : 'Critical') : 'No Data',
      };
    })
  );

  const topBranches = [...branchPerformance]
    .sort((a, b) => b.achievement - a.achievement)
    .slice(0, 5);

  const bottomBranches = [...branchPerformance]
    .sort((a, b) => a.achievement - b.achievement)
    .slice(0, 5);

  // Get areas in region for AreaPerformance page
  const areasInRegion = await Area.find({
    regionId: req.user.regionId,
    isActive: true,
  }).populate('regionId', 'name');

  const areas = await Promise.all(
    areasInRegion.map(async (area) => {
      const areaBranches = await Branch.find({
        areaId: area._id,
        isActive: true,
      });
      
      const areaBranchScores = await PerformanceScore.find({
        branchId: { $in: areaBranches.map(b => b._id) },
        period: 'Monthly',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });

      const areaAchievement = areaBranchScores.length > 0
        ? areaBranchScores.reduce((sum, s) => sum + s.finalScore, 0) / areaBranchScores.length
        : 0;

      const areaStaff = await User.countDocuments({
        branchId: { $in: areaBranches.map(b => b._id) },
        isActive: true,
      });

      return {
        id: area._id,
        name: area.name,
        branches: areaBranches.length,
        staff: areaStaff,
        achievement: Math.round(areaAchievement * 100) / 100,
        rating: areaAchievement >= 90 ? 'Outstanding' : areaAchievement >= 80 ? 'Very Good' : areaAchievement >= 70 ? 'Good' : areaAchievement >= 60 ? 'Needs Support' : 'Unsatisfactory',
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      branchCount,
      areaManagerCount: areaManagers.length,
      avgBranchAchievement: Math.round(avgBranchAchievement * 100) / 100,
      mappingCoverage: totalMappings,
      topBranches,
      bottomBranches,
      branches: branchPerformance,
      areas, // Add areas data for AreaPerformance page
      areaManagers: areaManagers.map(am => ({
        id: am._id,
        name: am.name,
        email: am.email,
      })),
    },
  });
});

// @desc    Get Area Manager Dashboard
// @route   GET /api/dashboard/area
// @access  Private (Area Manager)
export const getAreaDashboard = asyncHandler(async (req, res) => {
  // Get branches in area
  const branches = await Branch.find({
    areaId: req.user.areaId,
    isActive: true,
  });

  const branchCount = branches.length;
  
  // Get staff count
  const staffCount = await User.countDocuments({
    branchId: { $in: branches.map(b => b._id) },
    isActive: true,
  });

  // Calculate average branch achievement
  const branchScores = await PerformanceScore.find({
    branchId: { $in: branches.map(b => b._id) },
    period: 'Monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const avgBranchAchievement = branchScores.length > 0
    ? branchScores.reduce((sum, s) => sum + s.finalScore, 0) / branchScores.length
    : 0;

  // Get staff with <60% performance
  const lowPerformers = await PerformanceScore.find({
    branchId: { $in: branches.map(b => b._id) },
    finalScore: { $lt: 60 },
    period: 'Monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  }).populate('userId', 'name');

  // Get branch comparison data (KPI breakdown per branch)
  const branchComparison = await Promise.all(
    branches.map(async (branch) => {
      const branchScore = await PerformanceScore.findOne({
        branchId: branch._id,
        period: 'Monthly',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });
      
      const kpiScores = branchScore?.kpiScores || {};
      return {
        branch: branch.name,
        deposit: kpiScores.deposit?.percent || 0,
        digital: kpiScores.digital?.percent || 0,
        loan: kpiScores.loan?.percent || 0,
        customer: kpiScores.customer?.percent || 0,
      };
    })
  );

  // Get mapping coverage data
  const totalMappings = await AccountMapping.countDocuments({
    branchId: { $in: branches.map(b => b._id) },
  });
  const totalAccounts = await AccountMapping.countDocuments({
    branchId: { $in: branches.map(b => b._id) },
  });
  const mappedCount = totalMappings;
  const unmappedCount = Math.max(0, totalAccounts - mappedCount);
  
  const mappingData = [
    { name: 'Mapped', value: mappedCount, color: '#10b981' },
    { name: 'Unmapped', value: unmappedCount, color: '#ef4444' },
  ];

  // Get branch table data with full details
  const branchTableData = await Promise.all(
    branches.map(async (branch) => {
      const branchScore = await PerformanceScore.findOne({
        branchId: branch._id,
        period: 'Monthly',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });
      
      const branchUsers = await User.countDocuments({
        branchId: branch._id,
        isActive: true,
      });
      
      const kpiScores = branchScore?.kpiScores || {};
      return {
        id: branch._id,
        name: branch.name,
        region: branch.regionId?.name || 'N/A',
        deposit: kpiScores.deposit?.percent || 0,
        digital: kpiScores.digital?.percent || 0,
        loan: kpiScores.loan?.percent || 0,
        teamSize: branchUsers,
        status: branchScore ? (branchScore.finalScore >= 80 ? 'Good' : branchScore.finalScore >= 60 ? 'Warning' : 'Critical') : 'No Data',
      };
    })
  );

  // Get trend data (last 30 days deposit growth)
  const trendData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayTasks = await DailyTask.find({
      branchId: { $in: branches.map(b => b._id) },
      taskDate: { $gte: date, $lt: nextDate },
      taskType: 'Deposit Mobilization',
      approvalStatus: 'Approved',
    });
    
    const dayDeposit = dayTasks.reduce((sum, task) => sum + (task.amount || 0), 0);
    trendData.push({
      day: i + 1,
      deposit: dayDeposit,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      branchCount,
      staffCount,
      avgBranchAchievement: Math.round(avgBranchAchievement * 100) / 100,
      lowPerformersCount: lowPerformers.length,
      branches: branches.map(b => ({ id: b._id, name: b.name })),
      branchComparison,
      trendData,
      mappingData,
      branchTableData,
    },
  });
});

// @desc    Get Branch Manager Dashboard
// @route   GET /api/dashboard/branch
// @access  Private (Branch Manager)
export const getBranchDashboard = asyncHandler(async (req, res) => {
  const branchId = req.user.branchId;

  // Get total staff
  const totalStaff = await User.countDocuments({
    branch_code: req.user.branch_code,
    isActive: true,
  });

  // Get mapped accounts (only active accounts ≥ 500 ETB)
  const mappedAccounts = await AccountMapping.countDocuments({
    branchId,
    status: 'Active',
    current_balance: { $gte: 500 },
    active_status: true,
  });

  // Get daily deposit target and achievement
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = await DailyTask.find({
    branchId,
    taskDate: { $gte: today, $lt: tomorrow },
    taskType: 'Deposit Mobilization',
    approvalStatus: 'Approved',
  });

  const dailyDepositTarget = 27397; // This should come from plan
  const todayAchievement = todayTasks.reduce((sum, task) => sum + (task.amount || 0), 0);

  // Get team performance
  const teamPerformance = await PerformanceScore.find({
    branchId,
    period: 'Monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  })
    .populate('userId', 'name role position')
    .populate('branchId', 'name');

  // Get KPI data for dashboard
  const allBranchScores = await PerformanceScore.find({
    branchId,
    period: 'Monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Calculate average KPI percentages
  const kpiData = [];
  if (allBranchScores.length > 0) {
    const kpiCategories = ['Deposit Mobilization', 'Digital Channel Growth', 'Loan & NPL', 'Customer Base', 'Member Registration'];
    kpiCategories.forEach(category => {
      const categoryKey = category.toLowerCase().replace(/ & /g, '').replace(/\s+/g, '');
      const categoryKeyMap = {
        'depositmobilization': 'deposit',
        'digitalchannelgrowth': 'digital',
        'loan&npl': 'loan',
        'customerbase': 'customer',
        'memberregistration': 'member',
      };
      const key = categoryKeyMap[categoryKey] || categoryKey;
      
      const scores = allBranchScores
        .map(s => s.kpiScores?.[key]?.percent || 0)
        .filter(p => p > 0);
      
      const avgPercent = scores.length > 0
        ? Math.round(scores.reduce((sum, p) => sum + p, 0) / scores.length)
        : 0;
      
      kpiData.push({
        name: category,
        category: category,
        value: avgPercent,
        percent: avgPercent,
      });
    });
  }

  // Format team performance for table
  const formattedTeamPerformance = await Promise.all(
    teamPerformance.map(async (score) => {
      const kpiScores = score.kpiScores || {};
      const mappedAccountsCount = await AccountMapping.countDocuments({
        mappedTo: score.userId?._id,
        status: 'Active',
        current_balance: { $gte: 500 },
        active_status: true,
      });
      
      return {
        _id: score._id,
        id: score._id,
        name: score.userId?.name || 'Unknown',
        role: score.userId?.position || score.userId?.role || 'N/A',
        mappedAccounts: mappedAccountsCount,
        mappedAccountsCount: mappedAccountsCount,
        deposit: kpiScores.deposit?.percent || 0,
        digital: kpiScores.digital?.percent || 0,
        loan: kpiScores.loan?.percent || 0,
        customer: kpiScores.customer?.percent || 0,
        overall: score.finalScore || 0,
        status: score.finalScore >= 80 ? 'good' : score.finalScore >= 60 ? 'warning' : 'critical',
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      totalStaff,
      mappedAccounts,
      dailyDepositTarget,
      todayAchievement,
      todayAchievementPercent: dailyDepositTarget > 0
        ? Math.round((todayAchievement / dailyDepositTarget) * 100)
        : 0,
      achievementPercent: dailyDepositTarget > 0
        ? Math.round((todayAchievement / dailyDepositTarget) * 100)
        : 0,
      teamPerformance: formattedTeamPerformance,
      kpiData,
    },
  });
});

// @desc    Get Staff Dashboard
// @route   GET /api/dashboard/staff
// @access  Private (Staff)
export const getStaffDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const branchId = req.user.branchId;

  // Get current performance score
  const currentScore = await PerformanceScore.findOne({
    userId,
    period: 'Monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Get mapped accounts (only active accounts ≥ 500 ETB)
  const mappedAccounts = await AccountMapping.countDocuments({
    mappedTo: userId,
    status: 'Active',
    current_balance: { $gte: 500 },
    active_status: true,
  });

  // Get incremental growth for deposit mobilization
  const depositGrowth = await calculateIncrementalGrowth(
    userId,
    req.user.branch_code,
    'Deposit Mobilization',
    '2025-H2' // Default period, should be configurable
  );

  // Get rank in team
  const allScores = await PerformanceScore.find({
    branchId,
    period: 'Monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  }).sort({ finalScore: -1 });

  const rank = allScores.findIndex(s => s.userId.toString() === userId.toString()) + 1;
  const teamSize = allScores.length;

  res.status(200).json({
    success: true,
    data: {
      performanceScore: currentScore,
      mappedAccounts,
      depositGrowth, // Incremental growth instead of total balance
      rank,
      teamSize,
    },
  });
});

