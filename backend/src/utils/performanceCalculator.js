import prisma from '../config/database.js';
import { KPI_CATEGORY_TO_ENUM, TASK_TYPE_TO_ENUM } from './prismaHelpers.js';

/**
 * Calculate incremental growth for a user in a given period
 * Growth = current_balance - june_balance
 * Only accounts with current_balance ≥ 1,000 ETB count
 */
export const calculateIncrementalGrowth = async (userId, branch_code, kpi_category, period) => {
  try {
    // Get all mapped accounts for this user
    const mappedAccounts = await prisma.accountMapping.findMany({
      where: {
        mappedToId: userId,
        status: 'Active',
        current_balance: { gte: 1000 }, // Only active accounts ≥ 1,000 ETB
      },
    });

    let totalGrowth = 0;

    for (const account of mappedAccounts) {
      // Get active baseline balance for this account
      const juneBalance = await prisma.juneBalance.findFirst({
        where: {
          OR: [
            { account_id: account.accountNumber },
            { accountNumber: account.accountNumber },
          ],
          is_active: true, // Use active baseline
        },
      });

      const june_balance = juneBalance?.june_balance || 0;
      const current_balance = account.current_balance || 0;

      // Calculate incremental growth
      const growth = current_balance - june_balance;
      if (growth > 0) {
        totalGrowth += growth;
      }
    }

    return totalGrowth;
  } catch (error) {
    throw new Error(`Incremental growth calculation error: ${error.message}`);
  }
};

/**
 * Calculate KPI score for a user in a given period
 * Uses StaffPlan targets and incremental growth
 */
export const calculateKPIScore = async (userId, branch_code, period) => {
  try {
    // Get all staff plans for this user and period
    const staffPlans = await prisma.staffPlan.findMany({
      where: {
        userId,
        branch_code,
        period,
        status: 'Active',
      },
    });

    if (!staffPlans || staffPlans.length === 0) {
      throw new Error('No staff plans found for user in this period');
    }

    const kpiScores = {};
    let totalScorePoints = 0;

    // Calculate score for each KPI category
    for (const plan of staffPlans) {
      const { kpi_category, individual_target } = plan;

      // Calculate incremental growth for this KPI
      let actualGrowth = 0;

      if (kpi_category === 'Deposit_Mobilization') {
        actualGrowth = await calculateIncrementalGrowth(userId, branch_code, kpi_category, period);
      } else if (kpi_category === 'Mobile_Banking_Users') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'Mobile_Banking_Activation',
            approvalStatus: 'Approved',
          }
        });
      } else if (kpi_category === 'New_Member_Registration') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'New_Member_Registration',
            approvalStatus: 'Approved',
          }
        });
      } else if (kpi_category === 'New_Account_Opening') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'New_Account_Opening',
            approvalStatus: 'Approved',
          }
        });
      } else if (kpi_category === 'Account_Productivity') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'Account_Productivity',
            approvalStatus: 'Approved',
          },
        });
      } else if (kpi_category === 'Share_Capital_Growth') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'Share_Capital',
            approvalStatus: 'Approved',
            cbsValidated: true,
          }
        });
      } else if (kpi_category === 'Merchant_POS_Growth') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'Merchant_POS_Activation',
            approvalStatus: 'Approved',
          }
        });
      } else if (kpi_category === 'Billers_Recruitment') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'Biller_Recruitment',
            approvalStatus: 'Approved',
          }
        });
      } else if (kpi_category === 'Internal_Operations') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: { in: ['Transaction_Processing', 'SMS_Alert_Config', 'Complaint_Resolution'] },
            approvalStatus: 'Approved',
          }
        });
      }

      // Calculate percentage and score
      const percent = individual_target > 0 ? (actualGrowth / individual_target) * 100 : 0;

      // KPI weight (sums to 100, then scaled to 85% of final score)
      const config = await prisma.kpiFrameworkConfig.findMany();
      const weights = {};
      for (const c of config) {
        weights[c.kpiId] = c.weight;
      }
      // Fallback if no config exists yet
      if (Object.keys(weights).length === 0) {
        const defaultWeights = {
          'Account_Productivity': 30, 'Deposit_Mobilization': 24, 'Internal_Operations': 12,
          'Share_Capital_Growth': 9, 'New_Member_Registration': 6, 'New_Account_Opening': 6,
          'Mobile_Banking_Users': 5, 'Billers_Recruitment': 5, 'Merchant_POS_Growth': 3,
        };
        Object.assign(weights, defaultWeights);
      }

      const weight = weights[kpi_category] || 0;
      const categoryScore = (percent / 100) * weight;

      kpiScores[kpi_category] = {
        target: individual_target,
        actual: actualGrowth,
        percent: Math.round(percent * 100) / 100,
        weight: weight,
        score: Math.round(categoryScore * 100) / 100,
      };

      totalScorePoints += categoryScore;
    }

    // Total KPI score (85% weight)
    const kpiTotalScore = (totalScorePoints / 100) * 85;

    return {
      kpiScores,
      kpiTotalScore: Math.round(kpiTotalScore * 100) / 100,
    };
  } catch (error) {
    throw new Error(`KPI calculation error: ${error.message}`);
  }
};

/**
 * Calculate KPI score for a Branch Manager based on aggregated branch performance
 * BM achievement = sum of all staff's achievement vs branch plan target
 */
export const calculateBranchKPIScore = async (branch_code, period) => {
  try {
    const branch = await prisma.branch.findFirst({ where: { code: branch_code } });
    if (!branch) throw new Error(`Branch not found: ${branch_code}`);

    // Get all branch plans for this period
    const branchPlans = await prisma.plan.findMany({
      where: { branch_code, period, status: 'Active' },
    });

    if (!branchPlans || branchPlans.length === 0) {
      throw new Error('No branch plans found for this period');
    }

    // Get all staff in branch (excluding BM themselves)
    const staff = await prisma.user.findMany({
      where: { branchId: branch.id, isActive: true, role: { in: ['staff', 'supervisor'] } },
    });
    const staffIds = staff.map(s => s.id);

    const kpiScores = {};
    let totalScorePoints = 0;

    const config = await prisma.kpiFrameworkConfig.findMany();
    const weights = {};
    for (const c of config) {
      weights[c.kpiId] = c.weight;
    }
    if (Object.keys(weights).length === 0) {
      Object.assign(weights, {
        'Account_Productivity': 30, 'Deposit_Mobilization': 24, 'Internal_Operations': 12,
        'Share_Capital_Growth': 9, 'New_Member_Registration': 6, 'New_Account_Opening': 6,
        'Mobile_Banking_Users': 5, 'Billers_Recruitment': 5, 'Merchant_POS_Growth': 3,
      });
    }

    const KPI_TASK_TYPES = {
      'Account_Productivity': ['Account_Productivity'],
      'New_Member_Registration': ['New_Member_Registration'],
      'New_Account_Opening': ['New_Account_Opening'],
      'Share_Capital_Growth': ['Share_Capital'],
      'Mobile_Banking_Users': ['Mobile_Banking_Activation'],
      'Merchant_POS_Growth': ['Merchant_POS_Activation'],
      'Billers_Recruitment': ['Biller_Recruitment'],
      'Internal_Operations': ['Transaction_Processing', 'SMS_Alert_Config', 'Complaint_Resolution'],
    };

    for (const plan of branchPlans) {
      const { kpi_category, target_value } = plan;
      let actualGrowth = 0;

      if (kpi_category === 'Deposit_Mobilization') {
        actualGrowth = await calculateBranchDepositGrowth(branch_code, period);
      } else {
        const taskTypes = KPI_TASK_TYPES[kpi_category] || [];
        if (taskTypes.length > 0) {
          if (kpi_category === 'Share_Capital_Growth') {
            actualGrowth = await prisma.dailyTask.count({
              where: {
                submittedById: { in: staffIds },
                taskType: { in: taskTypes },
                approvalStatus: 'Approved',
                cbsValidated: true,
              }
            });
          } else {
            actualGrowth = await prisma.dailyTask.count({
              where: {
                submittedById: { in: staffIds },
                taskType: { in: taskTypes },
                approvalStatus: 'Approved',
              }
            });
          }
        }
      }

      const percent = target_value > 0 ? (actualGrowth / target_value) * 100 : 0;
      const weight = weights[kpi_category] || 0;
      const categoryScore = (percent / 100) * weight;

      kpiScores[kpi_category] = {
        target: target_value,
        actual: actualGrowth,
        percent: Math.round(percent * 100) / 100,
        weight: weight,
        score: Math.round(categoryScore * 100) / 100,
      };

      totalScorePoints += categoryScore;
    }

    const kpiTotalScore = (totalScorePoints / 100) * 85;

    return {
      kpiScores,
      kpiTotalScore: Math.round(kpiTotalScore * 100) / 100,
    };
  } catch (error) {
    throw new Error(`Branch KPI calculation error: ${error.message}`);
  }
};

/**
 * Calculate rating based on final score
 */
export const calculateRating = (finalScore) => {
  if (finalScore >= 120) return 'Outstanding';
  if (finalScore >= 100) return 'Exceeds_Expectations';
  if (finalScore >= 90) return 'Meets_Expectations';
  if (finalScore >= 80) return 'Needs_Improvement';
  return 'Unsatisfactory';
};

/**
 * Calculate deposit growth for entire branch (sum of all staff)
 */
export const calculateBranchDepositGrowth = async (branch_code, period) => {
  try {
    // Get branch ID from branch code
    const branch = await prisma.branch.findFirst({ where: { code: branch_code } });
    if (!branch) return 0;

    // Get june baselines (note: branch_code might be null, use account_id)
    const juneBaseline = await prisma.juneBalance.findMany({
      where: { is_active: true }
    });

    const accountIds = juneBaseline.map(j => j.account_id).filter(Boolean);
    const accountNumbers = juneBaseline.map(j => j.accountNumber).filter(Boolean);
    
    if (accountIds.length === 0 && accountNumbers.length === 0) return 0;

    const currentBalances = await prisma.accountMapping.findMany({
      where: {
        branchId: branch.id,
        status: 'Active',
        current_balance: { gte: 1000 },
        OR: [
          { accountNumber: { in: accountIds } },
          { accountNumber: { in: accountNumbers } }
        ]
      },
    });

    let totalGrowth = 0;
    for (const mapping of currentBalances) {
      const baseline = juneBaseline.find(j => 
        j.account_id === mapping.accountNumber || j.accountNumber === mapping.accountNumber
      );
      if (baseline) {
        const growth = mapping.current_balance - baseline.june_balance;
        if (growth > 0) totalGrowth += growth;
      }
    }

    return totalGrowth;
  } catch (error) {
    console.error('Branch deposit growth error:', error);
    return 0;
  }
};

/**
 * Calculate digital channel growth for branch
 */
export const calculateBranchDigitalGrowth = async (branch_code, period) => {
  try {
    // Get all active staff with digital targets
    const staffPlans = await prisma.staffPlan.findMany({
      where: {
        branch_code,
        status: 'Active',
        kpi_category: 'Mobile_Banking_Users'
      }
    });

    let totalDigital = 0;
    for (const plan of staffPlans) {
      // Count digital transactions for each staff's mapped accounts
      const digitalCount = await prisma.transaction.count({
        where: {
          account_no: { in: [] }, // Would need transaction type tracking
        }
      });
      totalDigital += digitalCount;
    }

    return totalDigital;
  } catch (error) {
    console.error('Branch digital growth error:', error);
    return 0;
  }
};
