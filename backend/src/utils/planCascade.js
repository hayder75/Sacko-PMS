import prisma from '../config/database.js';
import { KPI_CATEGORY_TO_ENUM } from './prismaHelpers.js';

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
    const { branch_code, kpi_category, period, target_value, target_type, id: branchPlanId, branchId } = branchPlan;

    // Get plan share config for this KPI category and branch
    let planShareConfig = await prisma.planShareConfig.findFirst({
      where: {
        kpi_category: kpi_category,
        branch_code,
        isActive: true,
      },
    });

    // If no branch-specific config, get default (branch_code = null)
    if (!planShareConfig) {
      planShareConfig = await prisma.planShareConfig.findFirst({
        where: {
          kpi_category: kpi_category,
          branch_code: null,
          isActive: true,
        },
      });
    }

    if (!planShareConfig) {
      throw new Error(`No plan share configuration found for KPI category: ${kpi_category}`);
    }

    // Get all active staff in this branch
    const allStaff = await prisma.user.findMany({
      where: {
        branch_code,
        isActive: true,
        role: { in: ['staff', 'subTeamLeader'] },
      },
    });

    // Map share config to actual percentages
    const shares = {
      'Branch Manager': planShareConfig.share_branch_manager,
      'Member Service Manager (MSM)': planShareConfig.share_msm,
      'Accountant': planShareConfig.share_accountant,
      'MSO': planShareConfig.share_mso
    };

    // Separate MSOs from other positions
    const msoPositions = ['Member Service Officer I', 'Member Service Officer II', 'Member Service Officer III'];
    const msoStaff = allStaff.filter(s => msoPositions.includes(s.position));
    const otherStaff = allStaff.filter(s => !msoPositions.includes(s.position));

    const staffPlansCreated = [];

    // Process non-MSO staff (BM, MSM, Accountant) - they get their individual percentages
    for (const staffMember of otherStaff) {
      const position = staffMember.position;
      // Note: we need to handle the display string vs enum mapping if necessary, 
      // but here we check against the display name which is what's in our POSITION_MAP.
      // However, planShareConfig uses BM, MSM, Accountant keys which often match the display names 
      // or we need specific logic.

      let planSharePercent = 0;
      if (position === 'Branch Manager') planSharePercent = shares['Branch Manager'];
      else if (position === 'Member Service Manager (MSM)') planSharePercent = shares['Member Service Manager (MSM)'];
      else if (position === 'Accountant') planSharePercent = shares['Accountant'];

      if (planSharePercent === 0) {
        continue; // Skip if no plan share for this position
      }

      // Calculate individual target
      const individualTarget = (target_value * planSharePercent) / 100;

      // Calculate breakdowns
      const breakdowns = calculateBreakdowns(individualTarget, period);

      // Create staff plan
      const staffPlan = await prisma.staffPlan.create({
        data: {
          branchPlanId: branchPlanId,
          branch_code,
          branchId,
          userId: staffMember.id,
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
        },
      });

      staffPlansCreated.push(staffPlan);
    }

    // Process MSOs - divide the MSO percentage equally among all MSOs
    const msoTotalPercent = shares['MSO'] || 0;
    if (msoTotalPercent > 0 && msoStaff.length > 0) {
      // Calculate each MSO's share (divide equally)
      const msoIndividualPercent = msoTotalPercent / msoStaff.length;
      const msoTotalTarget = (target_value * msoTotalPercent) / 100;
      const msoIndividualTarget = msoTotalTarget / msoStaff.length;

      for (const msoMember of msoStaff) {
        // Calculate breakdowns for this MSO's share
        const breakdowns = calculateBreakdowns(msoIndividualTarget, period);

        // Create staff plan for this MSO
        const staffPlan = await prisma.staffPlan.create({
          data: {
            branchPlanId: branchPlanId,
            branch_code,
            branchId,
            userId: msoMember.id,
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
          },
        });

        staffPlansCreated.push(staffPlan);
      }
    }

    return staffPlansCreated;
  } catch (error) {
    throw new Error(`Plan cascade to staff error: ${error.message}`);
  }
};

/**
 * Cascade plan when branch plan is created
 */
export const cascadeBranchPlan = async (branchPlan) => {
  try {
    // Delete existing staff plans for this branch plan if they exist (to avoid duplicates on re-cascade)
    await prisma.staffPlan.deleteMany({
      where: {
        branchPlanId: branchPlan.id
      }
    });

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
