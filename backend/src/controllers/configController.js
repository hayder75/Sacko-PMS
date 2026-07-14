import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { TASK_TYPE_MAP, KPI_CATEGORY_MAP, POSITION_MAP } from '../utils/prismaHelpers.js';

const HARDCODED_TASK_TYPES = Object.entries(TASK_TYPE_MAP).map(([value, label]) => ({ value, label }));

const HARDCODED_TASK_TYPE_TO_KPI = {
  'Deposit_Mobilization': 'Deposit_Mobilization',
  'New_Member_Registration': 'New_Member_Registration',
  'New_Account_Opening': 'New_Account_Opening',
  'Mobile_Banking_Activation': 'Mobile_Banking_Users',
  'Merchant_POS_Activation': 'Merchant_POS_Growth',
  'Biller_Recruitment': 'Billers_Recruitment',
  'Transaction_Processing': 'Internal_Operations',
  'SMS_Alert_Config': 'Internal_Operations',
  'Complaint_Resolution': 'Internal_Operations',
  'Share_Capital': 'Share_Capital_Growth',
  'Account_Productivity': 'Account_Productivity',
};

export const getConfig = asyncHandler(async (req, res) => {
  const activePeriods = await prisma.plan.findMany({
    where: { status: 'Active' },
    select: { period: true },
    distinct: ['period'],
    orderBy: { period: 'desc' }
  });

  const periodOptions = activePeriods.length > 0
    ? activePeriods.map(p => p.period)
    : ['2025-H2'];

  const positions = Object.entries(POSITION_MAP).map(([value, label]) => ({ value, label }));
  const kpiCategories = Object.entries(KPI_CATEGORY_MAP).map(([value, label]) => ({ value, label }));

  const productPlanCategories = await prisma.plan.findMany({
    where: { status: 'Active', product_category: { not: null } },
    select: { product_category: true },
    distinct: ['product_category'],
  });

  const kpiPlanCategories = await prisma.plan.findMany({
    where: { status: 'Active', product_category: null },
    select: { kpi_category: true },
    distinct: ['kpi_category'],
  });

  let taskTypes;
  let taskTypeToKpiMap;

  if (productPlanCategories.length > 0 || kpiPlanCategories.length > 0) {
    taskTypes = [];
    taskTypeToKpiMap = {};

    for (const pc of productPlanCategories) {
      const label = pc.product_category.replace(/_/g, ' ');
      taskTypes.push({ value: pc.product_category, label });
      taskTypeToKpiMap[pc.product_category] = 'Deposit_Mobilization';
    }

    for (const kc of kpiPlanCategories) {
      const label = kc.kpi_category.replace(/_/g, ' ');
      if (!taskTypes.some(t => t.value === kc.kpi_category)) {
        taskTypes.push({ value: kc.kpi_category, label });
        taskTypeToKpiMap[kc.kpi_category] = kc.kpi_category;
      }
    }
  } else {
    taskTypes = HARDCODED_TASK_TYPES;
    taskTypeToKpiMap = HARDCODED_TASK_TYPE_TO_KPI;
  }

  res.status(200).json({
    success: true,
    data: {
      taskTypes,
      kpiCategories,
      positions,
      periodOptions,
      taskTypeToKpiMap,
    }
  });
});
