import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const TASK_TO_KPI = {
  Deposit_Mobilization: 'Deposit_Mobilization',
  Loan_Follow_up: 'Loan_NPL',
  New_Customer: 'Customer_Base',
  Digital_Activation: 'Digital_Channel_Growth',
  Member_Registration: 'Member_Registration',
  Shareholder_Recruitment: 'Shareholder_Recruitment',
};

const KPI_LABELS = {
  Deposit_Mobilization: 'Deposit Mobilization',
  Digital_Channel_Growth: 'Digital Channel Growth',
  Member_Registration: 'Member Registration',
  Shareholder_Recruitment: 'Shareholder Recruitment',
  Loan_NPL: 'Loan & NPL',
  Customer_Base: 'Customer Base',
};

const KPI_ORDER = ['Deposit_Mobilization', 'Digital_Channel_Growth', 'Member_Registration', 'Shareholder_Recruitment', 'Loan_NPL', 'Customer_Base'];

// @desc    Get mapped accounts dashboard for a user
// @route   GET /api/mapped-accounts/dashboard
// @access  Private
export const getMappedAccountsDashboard = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { branch: { select: { name: true, id: true } } },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // 1. Fetch mapped accounts
  const accounts = await prisma.accountMapping.findMany({
    where: { mappedToId: userId, status: { not: 'Inactive' } },
    orderBy: { updatedAt: 'desc' },
  });

  const mappedAccounts = accounts.map(a => ({
    id: a.id,
    accountNumber: a.accountNumber,
    customerName: a.customerName,
    phoneNumber: a.phoneNumber,
    accountType: a.accountType,
    balance: a.balance,
    currentBalance: a.current_balance,
    juneBalance: a.june_balance,
    difference: (a.current_balance || 0) - (a.june_balance || 0),
    status: a.status,
    activeStatus: a.active_status,
    lastTransactionDate: a.last_transaction_date,
  }));

  // 2. Fetch staff plans for the user
  const staffPlans = await prisma.staffPlan.findMany({
    where: { userId, status: 'Active' },
    include: { branchPlan: { select: { target_value: true, period: true } } },
  });

  // 3. Fetch approved tasks submitted by the user
  const tasks = await prisma.dailyTask.findMany({
    where: {
      submittedById: userId,
      approvalStatus: 'Approved',
    },
    select: { taskType: true, amount: true },
  });

  // 4. Aggregate task amounts by KPI category
  const taskTotals = {};
  for (const t of tasks) {
    const kpi = TASK_TO_KPI[t.taskType];
    if (kpi) {
      taskTotals[kpi] = (taskTotals[kpi] || 0) + (t.amount || 0);
    }
  }

  // 5. Build plan progress
  const planProgress = KPI_ORDER.map(kpi => {
    const plansForKpi = staffPlans.filter(sp => sp.kpi_category === kpi);
    const target = plansForKpi.reduce((s, sp) => s + (sp.individual_target || 0), 0);
    const monthlyTarget = plansForKpi.reduce((s, sp) => s + (sp.monthly_target || 0), 0);
    const achieved = taskTotals[kpi] || 0;
    const progress = target > 0 ? Math.min(Math.round((achieved / target) * 100), 100) : 0;
    return {
      kpi,
      label: KPI_LABELS[kpi] || kpi,
      target,
      monthlyTarget,
      achieved,
      remaining: Math.max(target - achieved, 0),
      progress,
      period: plansForKpi[0]?.branchPlan?.period || '',
    };
  }).filter(p => p.target > 0);

  // 6. Summary stats
  const totalDeposits = taskTotals['Deposit_Mobilization'] || 0;
  const totalLoans = taskTotals['Loan_NPL'] || 0;

  res.status(200).json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, role: user.role, position: user.position, branchName: user.branch?.name || user.branch_code },
      stats: {
        totalAccounts: mappedAccounts.length,
        activeAccounts: mappedAccounts.filter(a => a.activeStatus).length,
        totalDeposits,
        totalLoans,
        totalDifference: mappedAccounts.reduce((s, a) => s + (a.difference || 0), 0),
      },
      accounts: mappedAccounts,
      planProgress,
    },
  });
});

// @desc    Get mapped accounts for a specific account number
// @route   GET /api/mapped-accounts/account/:accountNumber
// @access  Private
export const getAccountDetail = asyncHandler(async (req, res) => {
  const account = await prisma.accountMapping.findUnique({
    where: { accountNumber: req.params.accountNumber },
    include: {
      mappedTo: { select: { id: true, name: true, employeeId: true } },
      dailyTasks: {
        where: { approvalStatus: 'Approved' },
        orderBy: { taskDate: 'desc' },
        take: 20,
        select: { taskType: true, amount: true, taskDate: true, remarks: true },
      },
    },
  });

  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }

  res.status(200).json({
    success: true,
    data: {
      id: account.id,
      accountNumber: account.accountNumber,
      customerName: account.customerName,
      phoneNumber: account.phoneNumber,
      accountType: account.accountType,
      balance: account.balance,
      currentBalance: account.current_balance,
      juneBalance: account.june_balance,
      difference: (account.current_balance || 0) - (account.june_balance || 0),
      status: account.status,
      activeStatus: account.active_status,
      lastTransactionDate: account.last_transaction_date,
      mappedTo: account.mappedTo,
      recentTasks: account.dailyTasks,
    },
  });
});
