import prisma from '../config/database.js';
import { KPI_CATEGORY_TO_ENUM, TASK_TYPE_TO_ENUM } from './prismaHelpers.js';

/**
 * Calculate incremental growth for a user in a given period
 * Growth = current_balance - june_balance
 * Only accounts with current_balance ≥ 500 ETB count
 */
export const calculateIncrementalGrowth = async (userId, branch_code, kpi_category, period) => {
  try {
    // Get all mapped accounts for this user
    const mappedAccounts = await prisma.accountMapping.findMany({
      where: {
        mappedToId: userId,
        status: 'Active',
        current_balance: { gte: 500 }, // Only active accounts ≥ 500 ETB
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
      } else if (kpi_category === 'Digital_Channel_Growth') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'Digital_Activation',
            approvalStatus: 'Approved',
            cbsValidated: true,
          }
        });
      } else if (kpi_category === 'Member_Registration') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'Member_Registration',
            approvalStatus: 'Approved',
            cbsValidated: true,
          }
        });
      } else if (kpi_category === 'Customer_Base') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'New_Customer',
            approvalStatus: 'Approved',
            cbsValidated: true,
          }
        });
      } else if (kpi_category === 'Loan_NPL') {
        const tasks = await prisma.dailyTask.findMany({
          where: {
            submittedById: userId,
            taskType: 'Loan_Follow_up',
            approvalStatus: 'Approved',
            cbsValidated: true,
          },
          select: { amount: true }
        });
        actualGrowth = tasks.reduce((sum, task) => sum + (task.amount || 0), 0);
      } else if (kpi_category === 'Shareholder_Recruitment') {
        actualGrowth = await prisma.dailyTask.count({
          where: {
            submittedById: userId,
            taskType: 'Shareholder_Recruitment',
            approvalStatus: 'Approved',
            cbsValidated: true,
          }
        });
      }

      // Calculate percentage and score
      const percent = individual_target > 0 ? (actualGrowth / individual_target) * 100 : 0;

      // KPI weight (85% total, distributed by category)
      const weights = {
        'Deposit_Mobilization': 25,
        'Digital_Channel_Growth': 20,
        'Loan_NPL': 20,
        'Customer_Base': 15,
        'Member_Registration': 10,
        'Shareholder_Recruitment': 10,
      };

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
 * Calculate rating based on final score
 */
export const calculateRating = (finalScore) => {
  if (finalScore >= 90) return 'Outstanding';
  if (finalScore >= 80) return 'Very_Good';
  if (finalScore >= 70) return 'Good';
  if (finalScore >= 60) return 'Needs_Support';
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
        current_balance: { gte: 500 },
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
        kpi_category: 'Digital_Channel_Growth'
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
