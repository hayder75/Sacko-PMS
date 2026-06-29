import prisma from '../config/database.js';

const CASCADE_MATRIX = {
  'Account Productivity':       { branchManager: 15, operationSupervisor: 15, crSupervisor: 15, crOfficer: 20, csOfficer: 35 },
  'Deposit Mobilization':       { branchManager: 25, operationSupervisor: 10, crSupervisor: 25, crOfficer: 15, csOfficer: 25 },
  'New Member Registration':    { branchManager: 10, operationSupervisor:  0, crSupervisor: 35, crOfficer: 25, csOfficer: 30 },
  'New Account Opening':        { branchManager: 10, operationSupervisor: 10, crSupervisor: 20, crOfficer: 20, csOfficer: 40 },
  'Share Capital Growth':       { branchManager: 10, operationSupervisor:  0, crSupervisor: 40, crOfficer: 25, csOfficer: 25 },
  'Mobile Banking Users':       { branchManager:  5, operationSupervisor:  5, crSupervisor: 20, crOfficer: 20, csOfficer: 50 },
  'Merchant POS Growth':        { branchManager: 10, operationSupervisor:  0, crSupervisor: 35, crOfficer: 30, csOfficer: 25 },
  'Billers Recruitment':        { branchManager: 10, operationSupervisor:  0, crSupervisor: 35, crOfficer: 30, csOfficer: 25 },
  'Internal Operations':        { branchManager: 20, operationSupervisor: 30, crSupervisor:  0, crOfficer:  0, csOfficer: 50 },
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
    const { branch_code, kpi_category, period, target_value, target_type, id: branchPlanId, branchId } = branchPlan;

    const kpiKey = kpi_category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const shares = CASCADE_MATRIX[kpiKey];
    if (!shares) throw new Error(`No cascade matrix for KPI: ${kpiKey}`);

    const allStaff = await prisma.user.findMany({
      where: { branch_code, isActive: true, role: { in: ['staff', 'supervisor'] } },
    });

    const grouped = {};
    for (const s of allStaff) {
      const group = POSITION_GROUP[s.position];
      if (!group) continue;
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(s);
    }

    const staffPlansCreated = [];

    for (const [group, members] of Object.entries(grouped)) {
      const sharePercent = shares[group] || 0;
      if (sharePercent <= 0 || members.length === 0) continue;

      const groupTarget = (target_value * sharePercent) / 100;
      const perPerson = groupTarget / members.length;

      for (const member of members) {
        const breakdowns = calculateBreakdowns(perPerson, period);
        const staffPlan = await prisma.staffPlan.create({
          data: {
            branchPlanId,
            branch_code,
            branchId,
            userId: member.id,
            position: member.position,
            kpi_category,
            period,
            target_type,
            individual_target: perPerson,
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
