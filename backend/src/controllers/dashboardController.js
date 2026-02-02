import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { calculateIncrementalGrowth } from '../utils/performanceCalculator.js';

// @desc    Get HQ Dashboard data
// @route   GET /api/dashboard/hq
// @access  Private (HQ Admin)
export const getHQDashboard = asyncHandler(async (req, res) => {
  const totalBranches = await prisma.branch.count({ where: { isActive: true } });
  const totalStaff = await prisma.user.count({ where: { isActive: true, role: 'staff' } });

  const now = new Date();
  const performanceScores = await prisma.performanceScore.findMany({
    where: {
      period: 'Monthly',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    },
  });

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
      manager: { select: { name: true } },
      region: { select: { name: true } },
      area: { select: { name: true } },
    },
  });

  const branchPerformance = await Promise.all(
    branches.map(async (branch) => {
      const branchScores = await prisma.performanceScore.findMany({
        where: {
          branchId: branch.id,
          period: 'Monthly',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }
      });

      const avgScore = branchScores.length > 0
        ? branchScores.reduce((sum, s) => sum + s.finalScore, 0) / branchScores.length
        : 0;

      const kpiScores = branchScores.length > 0 ? (branchScores[0].kpiScores || {}) : {};

      return {
        branchId: branch.id,
        branch: branch.name,
        branchName: branch.name,
        region: branch.region?.name || 'N/A',
        area: branch.area?.name || 'N/A',
        averageScore: avgScore,
        deposit: kpiScores.deposit?.percent || 0,
        digital: kpiScores.digital?.percent || 0,
        loan: kpiScores.loan?.percent || 0,
        customer: kpiScores.customer?.percent || 0,
      };
    })
  );

  const performanceDistribution = [
    { rating: 'Outstanding', count: performanceScores.filter(s => s.finalScore >= 90).length },
    { rating: 'Very Good', count: performanceScores.filter(s => s.finalScore >= 80 && s.finalScore < 90).length },
    { rating: 'Good', count: performanceScores.filter(s => s.finalScore >= 70 && s.finalScore < 80).length },
    { rating: 'Needs Support', count: performanceScores.filter(s => s.finalScore >= 60 && s.finalScore < 70).length },
    { rating: 'Unsatisfactory', count: performanceScores.filter(s => s.finalScore < 60).length },
  ];

  const sortedBranches = [...branchPerformance].sort((a, b) => b.averageScore - a.averageScore);
  const topBranches = sortedBranches.slice(0, 5).map(b => ({
    branch: b.branchName,
    name: b.branchName,
    region: b.region,
    percent: Math.round(b.averageScore),
    rating: b.averageScore >= 90 ? 'Outstanding' : b.averageScore >= 80 ? 'Very Good' : b.averageScore >= 70 ? 'Good' : 'Needs Support',
  }));

  const bottomBranches = sortedBranches.slice(-5).reverse().map(b => ({
    branch: b.branchName,
    name: b.branchName,
    region: b.region,
    percent: Math.round(b.averageScore),
    rating: b.averageScore >= 90 ? 'Outstanding' : b.averageScore >= 80 ? 'Very Good' : b.averageScore >= 70 ? 'Good' : 'Needs Support',
  }));

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
      activityFeed: [],
    },
  });
});

// @desc    Get Regional Director Dashboard
// @route   GET /api/dashboard/regional
// @access  Private (Regional Director)
export const getRegionalDashboard = asyncHandler(async (req, res) => {
  const branches = await prisma.branch.findMany({
    where: { regionId: req.user.regionId, isActive: true },
    include: { area: { select: { name: true } }, manager: { select: { name: true } } }
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

  const branchPerformance = await Promise.all(
    branches.map(async (branch) => {
      const score = branchScores.find(s => s.branchId === branch.id);
      return {
        id: branch.id,
        name: branch.name,
        area: branch.area?.name || 'N/A',
        achievement: score ? Math.round(score.finalScore * 100) / 100 : 0,
        status: score ? (score.finalScore >= 80 ? 'Good' : score.finalScore >= 60 ? 'Warning' : 'Critical') : 'No Data',
      };
    })
  );

  const areasInRegion = await prisma.area.findMany({
    where: { regionId: req.user.regionId, isActive: true }
  });

  const areas = await Promise.all(
    areasInRegion.map(async (area) => {
      const areaBranches = branches.filter(b => b.areaId === area.id);
      const areaAchievement = areaBranches.length > 0
        ? branchScores.filter(s => areaBranches.some(b => b.id === s.branchId)).reduce((sum, s) => sum + s.finalScore, 0) / areaBranches.length
        : 0;

      return {
        id: area.id,
        name: area.name,
        branches: areaBranches.length,
        achievement: Math.round(areaAchievement * 100) / 100,
        rating: areaAchievement >= 90 ? 'Outstanding' : areaAchievement >= 80 ? 'Very Good' : 'Good',
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      branchCount: branches.length,
      avgBranchAchievement: Math.round(avgBranchAchievement * 100) / 100,
      mappingCoverage: totalMappings,
      topBranches: [...branchPerformance].sort((a, b) => b.achievement - a.achievement).slice(0, 5),
      bottomBranches: [...branchPerformance].sort((a, b) => a.achievement - b.achievement).slice(0, 5),
      branches: branchPerformance,
      areas,
    },
  });
});

// @desc    Get Area Manager Dashboard
export const getAreaDashboard = asyncHandler(async (req, res) => {
  const branches = await prisma.branch.findMany({ where: { areaId: req.user.areaId, isActive: true } });
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

  res.status(200).json({
    success: true,
    data: {
      branchCount: branches.length,
      avgBranchAchievement: Math.round(avgBranchAchievement * 100) / 100,
      mappingData: [
        { name: 'Mapped', value: totalMappings, color: '#10b981' },
        { name: 'Unmapped', value: 0, color: '#ef4444' },
      ],
      branches: branches.map(b => ({ id: b.id, name: b.name })),
    }
  });
});

// @desc    Get Branch Manager Dashboard
export const getBranchDashboard = asyncHandler(async (req, res) => {
  const branchId = req.user.branchId;
  const now = new Date();

  const totalStaff = await prisma.user.count({ where: { branchId, isActive: true } });
  const mappedAccounts = await prisma.accountMapping.count({
    where: { branchId, status: 'Active', current_balance: { gte: 500 }, active_status: true }
  });

  const teamPerformance = await prisma.performanceScore.findMany({
    where: { branchId, period: 'Monthly', year: now.getFullYear(), month: now.getMonth() + 1 },
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
        role: s.user?.position,
        overall: s.finalScore,
        status: s.finalScore >= 80 ? 'good' : 'warning',
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
