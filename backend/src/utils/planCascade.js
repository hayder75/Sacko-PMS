import Plan from '../models/Plan.js';
import StaffPlan from '../models/StaffPlan.js';
import PlanShareConfig from '../models/PlanShareConfig.js';
import User from '../models/User.js';

/**
 * Calculate breakdowns for a plan period
 */
const calculateBreakdowns = (target, period) => {
  let yearly = target;
  let monthly = 0;
  let weekly = 0;
  let daily = 0;

  if (period === '2025-H2') {
    // H2 = 6 months (July-December)
    monthly = target / 6;
    weekly = target / 26; // ~26 weeks in 6 months
    daily = target / 183; // ~183 days in 6 months
  } else if (period === 'Q4-2025') {
    // Q4 = 3 months
    monthly = target / 3;
    weekly = target / 13; // ~13 weeks in 3 months
    daily = target / 92; // ~92 days in 3 months
  } else if (period === 'December-2025') {
    // 1 month
    monthly = target;
    weekly = target / 4; // ~4 weeks in a month
    daily = target / 31; // ~31 days in December
  } else if (period === '2025') {
    // Full year
    monthly = target / 12;
    weekly = target / 52; // ~52 weeks in a year
    daily = target / 365; // ~365 days in a year
  }

  return {
    yearly: Math.round(yearly * 100) / 100,
    monthly: Math.round(monthly * 100) / 100,
    weekly: Math.round(weekly * 100) / 100,
    daily: Math.round(daily * 100) / 100,
  };
};

/**
 * Cascade branch plan to staff using position-based plan shares
 */
export const cascadePlanToStaff = async (branchPlan) => {
  try {
    const { branch_code, kpi_category, period, target_value, target_type } = branchPlan;

    // Get plan share config for this KPI category and branch
    let planShareConfig = await PlanShareConfig.findOne({
      kpi_category,
      branch_code,
      isActive: true,
    });

    // If no branch-specific config, get default (branch_code = null)
    if (!planShareConfig) {
      planShareConfig = await PlanShareConfig.findOne({
        kpi_category,
        branch_code: null,
        isActive: true,
      });
    }

    if (!planShareConfig) {
      throw new Error(`No plan share configuration found for KPI category: ${kpi_category}`);
    }

    // Get all active staff in this branch
    const allStaff = await User.find({
      branch_code,
      isActive: true,
      role: { $in: ['staff', 'subTeamLeader'] },
    });

    // Separate MSOs from other positions
    const msoPositions = ['Member Service Officer I', 'Member Service Officer II', 'Member Service Officer III'];
    const msoStaff = allStaff.filter(s => msoPositions.includes(s.position));
    const otherStaff = allStaff.filter(s => !msoPositions.includes(s.position));

    const staffPlans = [];

    // Process non-MSO staff (BM, MSM, Accountant) - they get their individual percentages
    for (const staffMember of otherStaff) {
      const position = staffMember.position;
      const planSharePercent = planShareConfig.planShares[position] || 0;

      if (planSharePercent === 0) {
        continue; // Skip if no plan share for this position
      }

      // Calculate individual target
      const individualTarget = (target_value * planSharePercent) / 100;

      // Calculate breakdowns
      const breakdowns = calculateBreakdowns(individualTarget, period);

      // Create staff plan
      const staffPlan = await StaffPlan.create({
        branchPlanId: branchPlan._id,
        branch_code,
        userId: staffMember._id,
        position,
        kpi_category,
        period,
        target_type,
        individual_target: individualTarget,
        yearly_target: breakdowns.yearly,
        monthly_target: breakdowns.monthly,
        weekly_target: breakdowns.weekly,
        daily_target: breakdowns.daily,
        plan_share_percent: planSharePercent,
        status: 'Active',
      });

      staffPlans.push(staffPlan);
    }

    // Process MSOs - divide the MSO percentage equally among all MSOs
    const msoTotalPercent = planShareConfig.planShares['MSO'] || 0;
    if (msoTotalPercent > 0 && msoStaff.length > 0) {
      // Calculate each MSO's share (divide equally)
      const msoIndividualPercent = msoTotalPercent / msoStaff.length;
      const msoTotalTarget = (target_value * msoTotalPercent) / 100;
      const msoIndividualTarget = msoTotalTarget / msoStaff.length;

      for (const msoMember of msoStaff) {
        // Calculate breakdowns for this MSO's share
        const breakdowns = calculateBreakdowns(msoIndividualTarget, period);

        // Create staff plan for this MSO
        const staffPlan = await StaffPlan.create({
          branchPlanId: branchPlan._id,
          branch_code,
          userId: msoMember._id,
          position: msoMember.position,
          kpi_category,
          period,
          target_type,
          individual_target: msoIndividualTarget,
          yearly_target: breakdowns.yearly,
          monthly_target: breakdowns.monthly,
          weekly_target: breakdowns.weekly,
          daily_target: breakdowns.daily,
          plan_share_percent: msoIndividualPercent, // Individual MSO's share
          status: 'Active',
        });

        staffPlans.push(staffPlan);
      }
    }

    return staffPlans;
  } catch (error) {
    throw new Error(`Plan cascade to staff error: ${error.message}`);
  }
};

/**
 * Cascade plan when branch plan is created
 */
export const cascadeBranchPlan = async (branchPlan) => {
  try {
    // Cascade to all staff in the branch
    const staffPlans = await cascadePlanToStaff(branchPlan);

    return {
      success: true,
      message: `Plan cascaded to ${staffPlans.length} staff members`,
      staffPlansCount: staffPlans.length,
    };
  } catch (error) {
    throw new Error(`Branch plan cascade error: ${error.message}`);
  }
};
