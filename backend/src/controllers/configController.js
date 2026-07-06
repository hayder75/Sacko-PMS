import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { TASK_TYPE_MAP, KPI_CATEGORY_MAP, POSITION_MAP } from '../utils/prismaHelpers.js';

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

  const taskTypes = Object.entries(TASK_TYPE_MAP).map(([value, label]) => ({ value, label }));

  const kpiCategories = Object.entries(KPI_CATEGORY_MAP).map(([value, label]) => ({ value, label }));

  const positions = Object.entries(POSITION_MAP).map(([value, label]) => ({ value, label }));

  const taskTypeToKpiMap = {
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
