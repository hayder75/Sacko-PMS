import prisma from '../config/database.js';
import { PRODUCT_CATEGORY_TO_KPI } from './prismaHelpers.js';

const CASCADE_MATRIX = {
  'Account Productivity':       { operationSupervisor: 30, crSupervisor: 15, crOfficer: 20, csOfficer: 35 },
  'Deposit Mobilization':       { operationSupervisor: 35, crSupervisor: 25, crOfficer: 15, csOfficer: 25 },
  'New Member Registration':    { operationSupervisor: 10, crSupervisor: 35, crOfficer: 25, csOfficer: 30 },
  'New Account Opening':        { operationSupervisor: 20, crSupervisor: 20, crOfficer: 20, csOfficer: 40 },
  'Share Capital Growth':       { operationSupervisor: 10, crSupervisor: 40, crOfficer: 25, csOfficer: 25 },
  'Mobile Banking Users':       { operationSupervisor: 10, crSupervisor: 20, crOfficer: 20, csOfficer: 50 },
  'Merchant POS Growth':        { operationSupervisor: 10, crSupervisor: 35, crOfficer: 30, csOfficer: 25 },
  'Billers Recruitment':        { operationSupervisor: 10, crSupervisor: 35, crOfficer: 30, csOfficer: 25 },
  'Internal Operations':        { operationSupervisor: 50, crSupervisor:  0, crOfficer:  0, csOfficer: 50 },
  'Collection Rate':            { operationSupervisor: 20, crSupervisor: 20, crOfficer: 25, csOfficer: 35 },
  'Portfolio Quality':          { operationSupervisor: 50, crSupervisor: 20, crOfficer: 15, csOfficer: 15 },
};

const POSITION_GROUP = {
  'Branch Manager':                    'branchManager',
  'Operation Supervisor':              'operationSupervisor',
  'Customer Relationship Supervisor':  'crSupervisor',
  'Customer Relationship Officer I':   'crOfficer',
  'Customer Service Officer I':        'csOfficer',
  'Customer Service Officer II':       'csOfficer',
  'Sales & Marketing Officer I':       'crOfficer',
  'Internal Auditor':                  null,
};

const calculateBreakdowns = (target, period) => {
  let yearly = target;
  let monthly = 0;
  let weekly = 0;
  let daily = 0;

  if (period?.includes('H2')) {
    monthly = target / 6;
    weekly = target / 26;
    daily = target / 183;
  } else if (period?.includes('Q4') || period?.includes('Q')) {
    monthly = target / 3;
    weekly = target / 13;
    daily = target / 92;
  } else if (period?.toLowerCase().includes('month')) {
    monthly = target;
    weekly = target / 4;
    daily = target / 30;
  } else if (period?.includes('2025') || period?.toLowerCase().includes('year')) {
    monthly = target / 12;
    weekly = target / 52;
    daily = target / 365;
  }

  return {
    yearly: Math.round(yearly * 100) / 100,
    monthly: Math.round(monthly * 100) / 100,
    weekly: Math.round(weekly * 100) / 100,
    daily: Math.round(daily * 100) / 100,
  };
};

export const cascadePlanToStaff = async (branchPlan) => {
  try {
    const { branch_code, kpi_category, product_category, period, target_value, target_count, target_type, id: branchPlanId, branchId } = branchPlan;

    // Determine the effective KPI key for the cascade matrix
    let kpiKey;
    if (product_category) {
      // Product-level plans: use the parent KPI for cascade shares
      const parentKpi = PRODUCT_CATEGORY_TO_KPI[product_category];
      if (!parentKpi) throw new Error(`No parent KPI for product category: ${product_category}`);
      kpiKey = parentKpi.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    } else {
      kpiKey = kpi_category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    const shares = CASCADE_MATRIX[kpiKey];
    if (!shares) throw new Error(`No cascade matrix for KPI: ${kpiKey}`);

    const allStaff = await prisma.user.findMany({
      where: { branch_code, isActive: true, role: { in: ['staff', 'supervisor'] } },
    });

    const grouped = {};
    for (const s of allStaff) {
      const normalizedPosition = s.position.replace(/_/g, ' ');
      const group = POSITION_GROUP[normalizedPosition];
      if (!group) continue;
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(s);
    }

    const staffPlansCreated = [];
    const effectiveKpi = product_category ? (PRODUCT_CATEGORY_TO_KPI[product_category] || kpi_category) : kpi_category;

    for (const [group, members] of Object.entries(grouped)) {
      const sharePercent = shares[group] || 0;
      if (sharePercent <= 0 || members.length === 0) continue;

      const groupTarget = (target_value * sharePercent) / 100;
      const perPerson = groupTarget / members.length;
      const perPersonCount = target_count ? (target_count * sharePercent) / 100 / members.length : 0;

      for (const member of members) {
        const breakdowns = calculateBreakdowns(perPerson, period);
        const staffPlan = await prisma.staffPlan.create({
          data: {
            branchPlanId,
            branch_code,
            branchId,
            userId: member.id,
            position: member.position,
            kpi_category: effectiveKpi,
            product_category: product_category || null,
            period,
            target_type,
            individual_target: perPerson,
            target_count: perPersonCount,
            yearly_target: breakdowns.yearly,
            monthly_target: breakdowns.monthly,
            weekly_target: breakdowns.weekly,
            daily_target: breakdowns.daily,
            plan_share_percent: sharePercent / members.length,
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

export const cascadeBranchPlan = async (branchPlan) => {
  try {
    await prisma.staffPlan.deleteMany({ where: { branchPlanId: branchPlan.id } });
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
