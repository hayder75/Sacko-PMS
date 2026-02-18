import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { calculateIncrementalGrowth } from '../utils/performanceCalculator.js';

// @desc    Get HQ Dashboard data
// @route   GET /api/dashboard/hq
// @access  Private (HQ Admin)
export const getHQDashboard = asyncHandler(async (req, res) => {
  const totalBranches = await prisma.branch.count({ where: { isActive: true } });
  // Include all staff, not just 'staff' role
  const totalStaff = await prisma.user.count({ where: { isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } } });

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  // Try to find scores for current month
  let performanceScores = await prisma.performanceScore.findMany({
    where: { period: 'Monthly', year, month },
  });

  // If no scores for current month, try previous month
  if (performanceScores.length === 0) {
    month = now.getMonth();
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    performanceScores = await prisma.performanceScore.findMany({
      where: { period: 'Monthly', year, month },
    });
  }

  const avgPlanAchievement = performanceScores.length > 0
    ? performanceScores.reduce((sum, score) => sum + score.finalScore, 0) / performanceScores.length
    : 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentValidations = await prisma.cbsValidation.findMany({
    where: { validationDate: { gte: thirtyDaysAgo } },
  });

  const cbsValidationRate = recentValidations.length > 0
    ? (recentValidations.filter(v => v.status === 'Completed').length / recentValidations.length) * 100
    : 0;

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    include: {
      region: { select: { name: true } },
      area: { select: { name: true } },
    },
  });

  const branchPerformance = branches.map(branch => {
    const scoresForBranch = performanceScores.filter(s => s.branchId === branch.id);
    const avgScore = scoresForBranch.length > 0
      ? scoresForBranch.reduce((sum, s) => sum + s.finalScore, 0) / scoresForBranch.length
      : 0;

    // Aggregate KPI scores if available
    const depositPct = scoresForBranch.length > 0 ? (scoresForBranch[0].kpiScores?.deposit?.percent || 0) : 0;
    const digitalPct = scoresForBranch.length > 0 ? (scoresForBranch[0].kpiScores?.digital?.percent || 0) : 0;
    const loanPct = scoresForBranch.length > 0 ? (scoresForBranch[0].kpiScores?.loan?.percent || 0) : 0;
    const customerPct = scoresForBranch.length > 0 ? (scoresForBranch[0].kpiScores?.customer?.percent || 0) : 0;

    return {
      branchId: branch.id,
      branch: branch.name,
      branchName: branch.name,
      region: branch.region?.name || 'N/A',
      area: branch.area?.name || 'N/A',
      averageScore: avgScore,
      deposit: depositPct,
      digital: digitalPct,
      loan: loanPct,
      customer: customerPct,
    };
  });

  const performanceDistribution = [
    { rating: 'Outstanding', count: performanceScores.filter(s => s.finalScore >= 90).length },
    { rating: 'Very Good', count: performanceScores.filter(s => s.finalScore >= 80 && s.finalScore < 90).length },
    { rating: 'Good', count: performanceScores.filter(s => s.finalScore >= 70 && s.finalScore < 80).length },
    { rating: 'Needs Support', count: performanceScores.filter(s => s.finalScore >= 60 && s.finalScore < 70).length },
    { rating: 'Unsatisfactory', count: performanceScores.filter(s => s.finalScore < 60).length },
  ];

  const sortedBranches = [...branchPerformance].sort((a, b) => b.averageScore - a.averageScore);

  // Fetch recent activities from AuditLog
  const auditLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } }
  });

  const activityFeed = auditLogs.map(log => ({
    id: log.id,
    message: `${log.user?.name || 'System'} ${log.action}: ${log.entityName || log.entityType}`,
    time: log.createdAt,
    description: log.details
  }));

  res.status(200).json({
    success: true,
    data: {
      totalBranches,
      totalStaff,
      avgPlanAchievement: Math.round(avgPlanAchievement * 100) / 100,
      cbsValidationRate: Math.round(cbsValidationRate * 100) / 100,
      branchKPIHeatmap: branchPerformance,
      performanceDistribution,
      topBranches: sortedBranches.slice(0, 5).map(b => ({
        ...b,
        percent: Math.round(b.averageScore),
        rating: b.averageScore >= 90 ? 'Outstanding' : b.averageScore >= 80 ? 'Very Good' : 'Good'
      })),
      bottomBranches: sortedBranches.filter(b => b.averageScore > 0).slice(-5).reverse().map(b => ({
        ...b,
        percent: Math.round(b.averageScore),
        rating: b.averageScore >= 60 ? 'Needs Support' : 'Unsatisfactory'
      })),
      activityFeed,
      dataPeriod: `${month}/${year}`
    },
  });
});

// @desc    Get Regional Director Dashboard
// @route   GET /api/dashboard/regional
// @access  Private (Regional Director)
export const getRegionalDashboard = asyncHandler(async (req, res) => {
  const branches = await prisma.branch.findMany({
    where: { regionId: req.user.regionId, isActive: true },
    include: { area: { select: { name: true } } }
  });

  const areaManagers = await prisma.user.findMany({
    where: { regionId: req.user.regionId, role: 'areaManager', isActive: true },
    select: { id: true, name: true, email: true }
  });

  const now = new Date();
  const branchScores = await prisma.performanceScore.findMany({
    where: {
      branchId: { in: branches.map(b => b.id) },
      period: 'Monthly',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }
  });

  const avgBranchAchievement = branchScores.length > 0
    ? branchScores.reduce((sum, s) => sum + s.finalScore, 0) / branchScores.length
    : 0;

  const totalMappings = await prisma.accountMapping.count({
    where: { branchId: { in: branches.map(b => b.id) } }
  });

  const branchPerformance = branches.map(branch => {
    const score = branchScores.find(s => s.branchId === branch.id);
    return {
      id: branch.id,
      name: branch.name,
      area: branch.area?.name || 'N/A',
      achievement: score ? Math.round(score.finalScore * 100) / 100 : 0,
      status: score ? (score.finalScore >= 80 ? 'Good' : score.finalScore >= 60 ? 'Warning' : 'Critical') : 'No Data',
    };
  });

  const areasInRegion = await prisma.area.findMany({
    where: { regionId: req.user.regionId, isActive: true }
  });

  const areas = areasInRegion.map(area => {
    const areaBranches = branches.filter(b => b.areaId === area.id);
    const scoresForArea = branchScores.filter(s => areaBranches.some(b => b.id === s.branchId));
    const areaAchievement = areaBranches.length > 0 && scoresForArea.length > 0
      ? scoresForArea.reduce((sum, s) => sum + s.finalScore, 0) / areaBranches.length
      : 0;

    return {
      id: area.id,
      name: area.name,
      branches: areaBranches.length,
      achievement: Math.round(areaAchievement * 100) / 100,
      rating: areaAchievement >= 90 ? 'Outstanding' : areaAchievement >= 80 ? 'Very Good' : 'Good',
    };
  });

  res.status(200).json({
    success: true,
    data: {
      branchCount: branches.length,
      areaManagerCount: areaManagers.length,
      areaManagers,
      avgBranchAchievement: Math.round(avgBranchAchievement * 100) / 100,
      mappingCoverage: totalMappings,
      topBranches: [...branchPerformance].sort((a, b) => b.achievement - a.achievement).slice(0, 5),
      bottomBranches: [...branchPerformance].filter(b => b.achievement > 0).sort((a, b) => a.achievement - b.achievement).slice(0, 5),
      branches: branchPerformance,
      areas,
    },
  });
});

// @desc    Get Area Manager Dashboard
export const getAreaDashboard = asyncHandler(async (req, res) => {
  const branches = await prisma.branch.findMany({
    where: { areaId: req.user.areaId, isActive: true },
    select: { id: true, name: true }
  });

  const now = new Date();
  const branchScores = await prisma.performanceScore.findMany({
    where: {
      branchId: { in: branches.map(b => b.id) },
      period: 'Monthly',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }
  });

  const avgBranchAchievement = branchScores.length > 0
    ? branchScores.reduce((sum, s) => sum + s.finalScore, 0) / branches.length
    : 0;

  const totalMappings = await prisma.accountMapping.count({
    where: { branchId: { in: branches.map(b => b.id) } }
  });

  res.status(200).json({
    success: true,
    data: {
      branchCount: branches.length,
      avgBranchAchievement: Math.round(avgBranchAchievement * 100) / 100,
      mappingData: [
        { name: 'Mapped', value: totalMappings, color: '#10b981' },
        { name: 'Unmapped', value: 0, color: '#ef4444' }, // Should be calculated vs total current accounts
      ],
      branches: await Promise.all(branches.map(async (b) => {
        const score = branchScores.find(s => s.branchId === b.id);
        const staffCount = await prisma.user.count({
          where: { branchId: b.id, isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } }
        });
        return {
          id: b.id,
          name: b.name,
          achievement: score ? Math.round(score.finalScore) : 0,
          staff: staffCount,
          status: score ? (score.finalScore >= 80 ? 'Excellent' : score.finalScore >= 60 ? 'On Track' : 'Needs Attention') : 'No Data'
        };
      })),
    }
  });
});

// @desc    Get Branch Manager Dashboard
export const getBranchDashboard = asyncHandler(async (req, res) => {
  const branchId = req.user.branchId;
  const now = new Date();

  const totalStaff = await prisma.user.count({
    where: { branchId, isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } }
  });

  const mappedAccounts = await prisma.accountMapping.count({
    where: { branchId, status: 'Active' }
  });

  const teamPerformance = await prisma.performanceScore.findMany({
    where: {
      branchId,
      period: 'Monthly',
      year: now.getFullYear(),
      month: now.getMonth() + 1
    },
    include: { user: { select: { id: true, name: true, position: true } } }
  });

  res.status(200).json({
    success: true,
    data: {
      totalStaff,
      mappedAccounts,
      teamPerformance: teamPerformance.map(s => ({
        id: s.id,
        name: s.user?.name,
        role: s.user?.position?.replace(/_/g, ' '),
        overall: Math.round(s.finalScore),
        status: s.finalScore >= 80 ? 'good' : s.finalScore >= 60 ? 'warning' : 'critical',
      })),
    }
  });
});

// @desc    Get Staff Dashboard
export const getStaffDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  const currentScore = await prisma.performanceScore.findFirst({
    where: { userId, period: 'Monthly', year: now.getFullYear(), month: now.getMonth() + 1 }
  });

  const mappedAccounts = await prisma.accountMapping.count({
    where: { mappedToId: userId, status: 'Active', current_balance: { gte: 500 }, active_status: true }
  });

  const depositGrowth = await calculateIncrementalGrowth(userId, req.user.branch_code, 'Deposit_Mobilization', '2025-H2');

  res.status(200).json({
    success: true,
    data: { performanceScore: currentScore, mappedAccounts, depositGrowth }
  });
});
