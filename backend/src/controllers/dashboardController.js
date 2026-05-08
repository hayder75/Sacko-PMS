import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { calculateIncrementalGrowth, calculateBranchDepositGrowth, calculateBranchDigitalGrowth } from '../utils/performanceCalculator.js';

// Helper to simplify KPI category names
const simplifyKpiKey = (key) => {
  const map = {
    'Deposit_Mobilization': 'deposit',
    'Digital_Channel_Growth': 'digital',
    'Member_Registration': 'member',
    'Shareholder_Recruitment': 'shareholder',
    'Loan_NPL': 'loan',
    'Customer_Base': 'customer',
  };
  return map[key] || key.toLowerCase();
};

// @desc    Get HQ Dashboard data
// @route   GET /api/dashboard/hq
// @access  Private (HQ Admin)
export const getHQDashboard = asyncHandler(async (req, res) => {
  const totalBranches = await prisma.branch.count({ where: { isActive: true } });
  const totalStaff = await prisma.user.count({ where: { isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } } });

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  // Calculate real-time branch performance
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    include: {
      region: { select: { name: true } },
      area: { select: { name: true } },
    },
  });

  const branchPerformance = [];
  let allTotalTarget = 0;
  let allTotalActual = 0;

  for (const branch of branches) {
    const branchStaff = await prisma.user.findMany({
      where: { branchId: branch.id, isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } }
    });

    let totalTarget = 0;
    let totalActual = 0;

    for (const staff of branchStaff) {
      const depositGrowth = await calculateIncrementalGrowth(staff.id, branch.code, 'Deposit_Mobilization', '2025-H2');
      const staffPlans = await prisma.staffPlan.findMany({
        where: { userId: staff.id, branch_code: branch.code, status: 'Active', kpi_category: 'Deposit_Mobilization' }
      });
      
      if (staffPlans.length > 0) {
        totalTarget += staffPlans[0].individual_target;
        totalActual += depositGrowth;
        allTotalTarget += staffPlans[0].individual_target;
        allTotalActual += depositGrowth;
      }
    }

    const avgScore = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    branchPerformance.push({
      branchId: branch.id,
      branch: branch.name,
      branchName: branch.name,
      region: branch.region?.name || 'N/A',
      area: branch.area?.name || 'N/A',
      averageScore: avgScore,
      deposit: avgScore,
      staffCount: branchStaff.length,
    });
  }

  const avgPlanAchievement = allTotalTarget > 0 ? (allTotalActual / allTotalTarget) * 100 : 0;

  // CBS validations
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentValidations = await prisma.cbsValidation.findMany({
    where: { validationDate: { gte: thirtyDaysAgo } },
  });
  const cbsValidationRate = recentValidations.length > 0
    ? (recentValidations.filter(v => v.status === 'Completed').length / recentValidations.length) * 100
    : 0;

  const performanceDistribution = [
    { rating: 'Outstanding', count: branchPerformance.filter(b => b.averageScore >= 90).length },
    { rating: 'Very Good', count: branchPerformance.filter(b => b.averageScore >= 80 && b.averageScore < 90).length },
    { rating: 'Good', count: branchPerformance.filter(b => b.averageScore >= 70 && b.averageScore < 80).length },
    { rating: 'Needs Support', count: branchPerformance.filter(b => b.averageScore >= 60 && b.averageScore < 70).length },
    { rating: 'Unsatisfactory', count: branchPerformance.filter(b => b.averageScore < 60 && b.averageScore > 0).length },
  ];

  const sortedBranches = [...branchPerformance].sort((a, b) => b.averageScore - a.averageScore);

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
        rating: b.averageScore >= 90 ? 'Outstanding' : b.averageScore >= 80 ? 'Very Good' : b.averageScore >= 70 ? 'Good' : 'Needs Support'
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
export const getRegionalDashboard = asyncHandler(async (req, res) => {
  const branches = await prisma.branch.findMany({
    where: { regionId: req.user.regionId, isActive: true },
    include: { area: { select: { name: true } } }
  });

  const areaManagers = await prisma.user.findMany({
    where: { regionId: req.user.regionId, role: 'areaManager', isActive: true },
    select: { id: true, name: true, email: true }
  });

  const branchPerformance = [];
  let totalTarget = 0;
  let totalActual = 0;

  for (const branch of branches) {
    const branchStaff = await prisma.user.findMany({
      where: { branchId: branch.id, isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } }
    });

    let bTarget = 0;
    let bActual = 0;

    for (const staff of branchStaff) {
      const growth = await calculateIncrementalGrowth(staff.id, branch.code, 'Deposit_Mobilization', '2025-H2');
      const staffPlans = await prisma.staffPlan.findMany({
        where: { userId: staff.id, branch_code: branch.code, status: 'Active', kpi_category: 'Deposit_Mobilization' }
      });
      if (staffPlans.length > 0) {
        bTarget += staffPlans[0].individual_target;
        bActual += growth;
        totalTarget += staffPlans[0].individual_target;
        totalActual += growth;
      }
    }

    const achievement = bTarget > 0 ? (bActual / bTarget) * 100 : 0;
    branchPerformance.push({
      id: branch.id,
      name: branch.name,
      area: branch.area?.name || 'N/A',
      achievement: Math.round(achievement),
      status: achievement >= 80 ? 'Good' : achievement >= 60 ? 'Warning' : achievement > 0 ? 'Critical' : 'No Data',
    });
  }

  const avgBranchAchievement = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  const totalMappings = await prisma.accountMapping.count({
    where: { branchId: { in: branches.map(b => b.id) } }
  });

  const areasInRegion = await prisma.area.findMany({
    where: { regionId: req.user.regionId, isActive: true }
  });

  const areas = areasInRegion.map(area => {
    const areaBranches = branches.filter(b => b.areaId === area.id);
    return {
      id: area.id,
      name: area.name,
      branches: areaBranches.length,
      achievement: 0,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      branchCount: branches.length,
      areaManagerCount: areaManagers.length,
      areaManagers,
      avgBranchAchievement: Math.round(avgBranchAchievement),
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

  const branchPerformance = [];
  let totalTarget = 0;
  let totalActual = 0;

  for (const branch of branches) {
    const staffCount = await prisma.user.count({
      where: { branchId: branch.id, isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } }
    });

    const branchStaff = await prisma.user.findMany({
      where: { branchId: branch.id, isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } }
    });

    let bTarget = 0;
    let bActual = 0;

    for (const staff of branchStaff) {
      const growth = await calculateIncrementalGrowth(staff.id, branch.code, 'Deposit_Mobilization', '2025-H2');
      const staffPlans = await prisma.staffPlan.findMany({
        where: { userId: staff.id, branch_code: branch.code, status: 'Active', kpi_category: 'Deposit_Mobilization' }
      });
      if (staffPlans.length > 0) {
        bTarget += staffPlans[0].individual_target;
        bActual += growth;
        totalTarget += staffPlans[0].individual_target;
        totalActual += growth;
      }
    }

    const achievement = bTarget > 0 ? (bActual / bTarget) * 100 : 0;
    branchPerformance.push({
      id: branch.id,
      name: branch.name,
      achievement: Math.round(achievement),
      staff: staffCount,
      status: achievement >= 80 ? 'Excellent' : achievement >= 60 ? 'On Track' : achievement > 0 ? 'Needs Attention' : 'No Data',
    });
  }

  const avgBranchAchievement = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  const totalMappings = await prisma.accountMapping.count({
    where: { branchId: { in: branches.map(b => b.id) } }
  });

  res.status(200).json({
    success: true,
    data: {
      branchCount: branches.length,
      avgBranchAchievement: Math.round(avgBranchAchievement),
      mappingData: [
        { name: 'Mapped', value: totalMappings, color: '#10b981' },
        { name: 'Unmapped', value: 0, color: '#ef4444' },
      ],
      branches: branchPerformance,
    },
  });
});

// @desc    Get Branch Manager Dashboard
export const getBranchDashboard = asyncHandler(async (req, res) => {
  const branchId = req.user.branchId;
  const branchCode = req.user.branch_code;

  const totalStaff = await prisma.user.count({
    where: { branchId, isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } }
  });

  const mappedAccounts = await prisma.accountMapping.count({
    where: { branchId, status: 'Active' }
  });

  // Get daily target from branch plan ( Deposit_Mobilization)
  const branchPlan = await prisma.plan.findFirst({
    where: { branch_code: branchCode, status: 'Active', kpi_category: 'Deposit_Mobilization' },
    orderBy: { createdAt: 'desc' }
  });

  const dailyDepositTarget = branchPlan ? Math.round(branchPlan.target_value / 30) : 0;

  // Calculate today's achievement (from today's transactions)
  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today);
  const juneBaseline = await prisma.juneBalance.findMany({
    where: { branch_code: branchCode }
  });
  
  const accountNos = juneBaseline.map(j => j.account_no);
  let todayAchievement = 0;
  let todayAchievementPercent = 0;
  
  // Get transactions table
  try {
    if (accountNos.length > 0) {
      const todayTransactions = await prisma.transaction.groupBy({
        by: ['account_no'],
        where: {
          account_no: { in: accountNos },
          transaction_date: { gte: todayStart }
        },
        _sum: { credit: true }
      });
      todayAchievement = todayTransactions.reduce((sum, t) => sum + (t._sum.credit || 0), 0);
      todayAchievementPercent = dailyDepositTarget > 0 ? Math.round((todayAchievement / dailyDepositTarget) * 100) : 0;
    }
  } catch(e) {
    console.log('Transaction query skipped:', e.message);
  }

  // Calculate KPI data from branch plan
  const kpiData = [];
  if (branchPlan) {
    // Deposit Mobilization - use actual mapped account balances as fallback
    const branch = await prisma.branch.findFirst({ where: { code: branchCode } });
    const allBranchAccounts = await prisma.accountMapping.findMany({
      where: { branchId: branch?.id, status: 'Active', current_balance: { gte: 500 } }
    });
    const depositActual = allBranchAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
    const depositPercent = branchPlan.target_value > 0 ? Math.round((depositActual / branchPlan.target_value) * 100) : 0;
    kpiData.push({ category: 'Deposit Mobilization', name: 'Deposit Mobilization', value: depositPercent, target: branchPlan.target_value, actual: depositActual });
    
    // Digital Channel - calculate from staff digital KPIs
    try {
      const digitalPlan = await prisma.staffPlan.findFirst({
        where: { branch_code: branchCode, status: 'Active', kpi_category: 'Digital_Channel_Growth' }
      });
      if (digitalPlan) {
        const digitalActual = await calculateBranchDigitalGrowth(branchCode, '2025-H2');
        const digitalPercent = digitalPlan.individual_target > 0 ? Math.round((digitalActual / digitalPlan.individual_target) * 100) : 0;
        kpiData.push({ category: 'Digital Channel Growth', name: 'Digital Channel', value: digitalPercent, target: digitalPlan.individual_target, actual: digitalActual });
      }
    } catch(e) {
      console.log('Digital plan query skipped');
    }
    
    // Customer Growth
    try {
      const memberPlan = await prisma.staffPlan.findFirst({
        where: { branch_code: branchCode, status: 'Active', kpi_category: 'Member_Registration' }
      });
      if (memberPlan) {
        kpiData.push({ category: 'Member Growth', name: 'Member Growth', value: 0, target: memberPlan.individual_target, actual: 0 });
      }
    } catch(e) {
      console.log('Member plan query skipped');
    }
  }

  const teamMembers = await prisma.user.findMany({
    where: { branchId, isActive: true, role: { in: ['staff', 'subTeamLeader', 'lineManager'] } },
    select: { id: true, name: true, position: true, employeeId: true }
  });

  const teamPerformance = [];
  for (const member of teamMembers) {
    const depositGrowth = await calculateIncrementalGrowth(member.id, branchCode, 'Deposit_Mobilization', '2025-H2');
    
    const staffPlans = await prisma.staffPlan.findMany({
      where: { userId: member.id, branch_code: branchCode, status: 'Active', kpi_category: 'Deposit_Mobilization' }
    });

    let totalTarget = 0;
    let totalActual = depositGrowth;
    if (staffPlans.length > 0) {
      totalTarget = staffPlans[0].individual_target;
    }

    const percent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    teamPerformance.push({
      id: member.id,
      name: member.name,
      role: member.position?.replace(/_/g, ' '),
      target: totalTarget,
      actual: totalActual,
      overall: Math.round(percent),
      status: percent >= 80 ? 'good' : percent >= 60 ? 'warning' : percent > 0 ? 'critical' : 'no-data',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      totalStaff,
      mappedAccounts,
      dailyDepositTarget,
      todayAchievement,
      todayAchievementPercent,
      kpiData,
      teamPerformance,
    }
  });
});

// @desc    Get Staff Dashboard
export const getStaffDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const branchCode = req.user.branch_code;

  // Get mapped accounts count
  const mappedAccounts = await prisma.accountMapping.count({
    where: { mappedToId: userId, status: 'Active', current_balance: { gte: 500 }, active_status: true }
  });

  // Calculate real-time deposit growth
  const depositGrowth = await calculateIncrementalGrowth(userId, branchCode, 'Deposit_Mobilization', '2025-H2');

  // Get staff plans
  const staffPlans = await prisma.staffPlan.findMany({
    where: { userId, branch_code: branchCode, status: 'Active' }
  });

  // Calculate KPI breakdown with simplified keys
  const kpiBreakdown = {};
  for (const plan of staffPlans) {
    let actual = 0;
    if (plan.kpi_category === 'Deposit_Mobilization') {
      actual = depositGrowth;
    }
    const percent = plan.individual_target > 0 ? (actual / plan.individual_target) * 100 : 0;
    const simpleKey = simplifyKpiKey(plan.kpi_category);
    kpiBreakdown[simpleKey] = {
      target: plan.individual_target,
      actual: actual,
      percent: Math.round(percent * 100) / 100,
    };
  }

  res.status(200).json({
    success: true,
    data: { 
      performanceScore: null, 
      mappedAccounts, 
      depositGrowth,
      kpiBreakdown,
    }
  });
});