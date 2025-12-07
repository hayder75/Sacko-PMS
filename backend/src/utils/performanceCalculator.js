import PerformanceScore from '../models/PerformanceScore.js';
import StaffPlan from '../models/StaffPlan.js';
import DailyTask from '../models/DailyTask.js';
import AccountMapping from '../models/AccountMapping.js';
import JuneBalance from '../models/JuneBalance.js';

/**
 * Calculate incremental growth for a user in a given period
 * Growth = current_balance - june_balance
 * Only accounts with current_balance ≥ 500 ETB count
 */
export const calculateIncrementalGrowth = async (userId, branch_code, kpi_category, period) => {
  try {
    // Get all mapped accounts for this user
    const mappedAccounts = await AccountMapping.find({
      mappedTo: userId,
      status: 'Active',
      current_balance: { $gte: 500 }, // Only active accounts ≥ 500 ETB
    });

    let totalGrowth = 0;

    for (const account of mappedAccounts) {
      // Get active baseline balance for this account
      const juneBalance = await JuneBalance.findOne({
        $or: [
          { account_id: account.accountNumber },
          { accountNumber: account.accountNumber },
        ],
        is_active: true, // Use active baseline
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
    const staffPlans = await StaffPlan.find({
      userId,
      branch_code,
      period,
      status: 'Active',
    });

    if (!staffPlans || staffPlans.length === 0) {
      throw new Error('No staff plans found for user in this period');
    }

    const kpiScores = {};
    let totalKPIScore = 0;

    // Calculate score for each KPI category
    for (const plan of staffPlans) {
      const { kpi_category, individual_target } = plan;

      // Calculate incremental growth for this KPI
      let actualGrowth = 0;

      if (kpi_category === 'Deposit Mobilization') {
        actualGrowth = await calculateIncrementalGrowth(userId, branch_code, kpi_category, period);
      } else if (kpi_category === 'Digital Channel Growth') {
        // Count approved + CBS-validated digital activation tasks
        const tasks = await DailyTask.find({
          submittedBy: userId,
          taskType: 'Digital Activation',
          approvalStatus: 'Approved',
          cbsValidated: true,
        });
        actualGrowth = tasks.length;
      } else if (kpi_category === 'Member Registration') {
        const tasks = await DailyTask.find({
          submittedBy: userId,
          taskType: 'Member Registration',
          approvalStatus: 'Approved',
          cbsValidated: true,
        });
        actualGrowth = tasks.length;
      } else if (kpi_category === 'Customer Base') {
        const tasks = await DailyTask.find({
          submittedBy: userId,
          taskType: 'New Customer',
          approvalStatus: 'Approved',
          cbsValidated: true,
        });
        actualGrowth = tasks.length;
      } else if (kpi_category === 'Loan & NPL') {
        // Sum loan recovery amounts
        const tasks = await DailyTask.find({
          submittedBy: userId,
          taskType: 'Loan Follow-up',
          approvalStatus: 'Approved',
          cbsValidated: true,
        });
        actualGrowth = tasks.reduce((sum, task) => sum + (task.amount || 0), 0);
      }

      // Calculate percentage and score
      const percent = individual_target > 0 ? (actualGrowth / individual_target) * 100 : 0;
      
      // KPI weight (85% total, distributed by category)
      const weights = {
        'Deposit Mobilization': 25,
        'Digital Channel Growth': 20,
        'Loan & NPL': 20,
        'Customer Base': 15,
        'Member Registration': 10,
        'Shareholder Recruitment': 10,
      };
      
      const weight = weights[kpi_category] || 0;
      const score = (percent / 100) * weight;

      kpiScores[kpi_category] = {
        target: individual_target,
        actual: actualGrowth,
        percent: Math.round(percent * 100) / 100,
        weight: weight,
        score: Math.round(score * 100) / 100,
      };

      totalKPIScore += score;
    }

    // Total KPI score (85% weight)
    const kpiTotalScore = (totalKPIScore / 100) * 85;

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
  if (finalScore >= 80) return 'Very Good';
  if (finalScore >= 70) return 'Good';
  if (finalScore >= 60) return 'Needs Support';
  return 'Unsatisfactory';
};
