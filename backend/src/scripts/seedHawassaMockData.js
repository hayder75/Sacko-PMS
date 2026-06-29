import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const UUIDS = {
  branch: null,
  admin: null,
  bm: null,
  msm: null,
  acct: null,
  mso1: null,
  mso2: null,
  mso3: null,
};

const AMHARIC_ACCOUNTS = [
  { account: '100001', name: 'Abebe Kebede', kpi: 'Deposit_Mobilization' },
  { account: '100002', name: 'Almaz G/Hiwot', kpi: 'Deposit_Mobilization' },
  { account: '100003', name: 'Bekele Mamo', kpi: 'Deposit_Mobilization' },
  { account: '100004', name: 'Chaltu Hunde', kpi: 'Deposit_Mobilization' },
  { account: '100005', name: 'Dawit Lemma', kpi: 'Deposit_Mobilization' },
  { account: '100006', name: 'Eyerusalem Tilahun', kpi: 'Deposit_Mobilization' },
  { account: '100007', name: 'Fikirte Admasu', kpi: 'Deposit_Mobilization' },
  { account: '100008', name: 'Genet Wondimu', kpi: 'Deposit_Mobilization' },
  { account: '100009', name: 'Hiwot Belayneh', kpi: 'Digital_Channel_Growth' },
  { account: '100010', name: 'Kidist Hailu', kpi: 'Digital_Channel_Growth' },
  { account: '100011', name: 'Lemlem Gebre', kpi: 'Digital_Channel_Growth' },
  { account: '100012', name: 'Mekdes Berhe', kpi: 'Digital_Channel_Growth' },
  { account: '100013', name: 'Saba Tekle', kpi: 'Member_Registration' },
  { account: '100014', name: 'Tigist Desta', kpi: 'Member_Registration' },
  { account: '100015', name: 'Wubet Alemu', kpi: 'Member_Registration' },
  { account: '100016', name: 'Yordanos Tadesse', kpi: 'Shareholder_Recruitment' },
  { account: '100017', name: 'Zewditu Molla', kpi: 'Shareholder_Recruitment' },
  { account: '100018', name: 'Birtukan Yimer', kpi: 'Deposit_Mobilization' },
  { account: '100019', name: 'Tsehay Yohannes', kpi: 'Deposit_Mobilization' },
  { account: '100020', name: 'Meron Tesfaye', kpi: 'Member_Registration' },
  { account: '100021', name: 'Selam Adane', kpi: 'Digital_Channel_Growth' },
  { account: '100022', name: 'Tsion Tadesse', kpi: 'Deposit_Mobilization' },
];

async function main() {
  await prisma.();
  console.log('Connected to PostgreSQL\n');

  // Load existing IDs
  UUIDS.admin = (await prisma.user.findUnique({ where: { email: 'admin@sako.com' } }))?.id;
  UUIDS.branch = (await prisma.branch.findFirst({ where: { code: 'HAWASSA_MAIN' } }))?.id;
  UUIDS.bm = (await prisma.user.findUnique({ where: { email: 'abebe.tadesse@hawassa_main.et' } }))?.id;
  UUIDS.msm = (await prisma.user.findUnique({ where: { email: 'bekele.molla@hawassa_main.et' } }))?.id;
  UUIDS.acct = (await prisma.user.findUnique({ where: { email: 'almaz.worku@hawassa_main.et' } }))?.id;
  UUIDS.mso1 = (await prisma.user.findUnique({ where: { email: 'chaltu.desta@hawassa_main.et' } }))?.id;
  UUIDS.mso2 = (await prisma.user.findUnique({ where: { email: 'dawit.haile@hawassa_main.et' } }))?.id;
  UUIDS.mso3 = (await prisma.user.findUnique({ where: { email: 'eyerusalem.tesfaye@hawassa_main.et' } }))?.id;

  console.log('Existing IDs:', JSON.stringify(UUIDS, null, 2));

  const branchCode = 'HAWASSA_MAIN';
  const period = '2025-H2';

  // 1. Teams & Sub-Teams
  console.log('\n1. Creating Teams...');
  const team = await prisma.team.upsert({
    where: { code: 'HAWASSA_MAIN-TEAM1' },
    update: { managerId: UUIDS.msm },
    create: {
      name: 'Hawassa Main Team 1',
      code: 'HAWASSA_MAIN-TEAM1',
      branchId: UUIDS.branch,
      managerId: UUIDS.msm,
    },
  });
  const subTeam = await prisma.subTeam.upsert({
    where: { code: 'HAWASSA_MAIN-SUBTEAM1' },
    update: { leaderId: UUIDS.acct, members: { set: [UUIDS.mso1, UUIDS.mso2, UUIDS.mso3].map(id => ({ id })) } },
    create: {
      name: 'Hawassa Main Sub-Team 1',
      code: 'HAWASSA_MAIN-SUBTEAM1',
      teamId: team.id,
      branchId: UUIDS.branch,
      leaderId: UUIDS.acct,
      members: { connect: [UUIDS.mso1, UUIDS.mso2, UUIDS.mso3].map(id => ({ id })) },
    },
  });

  // 2. Product-KPI Mappings
  console.log('2. Creating Product-KPI Mappings...');
  const products = [
    { cbs: 'Medbegna Saving', kpi: 'Deposit_Mobilization' },
    { cbs: 'Felagot Saving', kpi: 'Deposit_Mobilization' },
    { cbs: 'Special Saving', kpi: 'Deposit_Mobilization' },
    { cbs: 'Super Saving', kpi: 'Deposit_Mobilization' },
    { cbs: 'Digital Saving', kpi: 'Digital_Channel_Growth' },
    { cbs: 'Share Account', kpi: 'Shareholder_Recruitment' },
    { cbs: 'Member Registration', kpi: 'Member_Registration' },
    { cbs: 'Sixty Days Loan', kpi: 'Loan_NPL' },
  ];
  for (const p of products) {
    await prisma.productKpiMapping.upsert({
      where: { cbs_product_name: p.cbs },
      update: { kpi_category: p.kpi, status: 'active', mappedById: UUIDS.admin },
      create: { cbs_product_name: p.cbs, kpi_category: p.kpi, status: 'active', mappedById: UUIDS.admin },
    });
  }

  // 3. Plans
  console.log('3. Creating Plans...');
  const planConfigs = [
    { kpi: 'Deposit_Mobilization', target: 500000 },
    { kpi: 'Digital_Channel_Growth', target: 30 },
    { kpi: 'Member_Registration', target: 15 },
    { kpi: 'Shareholder_Recruitment', target: 10 },
  ];
  for (const pc of planConfigs) {
    const planId = ;
    await prisma.plan.upsert({
      where: { id: planId },
      update: { target_value: pc.target, status: 'Active' },
      create: {
        id: planId,
        branch_code: branchCode,
        branchId: UUIDS.branch,
        kpi_category: pc.kpi,
        period,
        target_value: pc.target,
        target_type: 'incremental',
        status: 'Active',
        createdById: UUIDS.bm,
      },
    });
  }

  // 4. Staff Plans
  console.log('4. Creating Staff Plans...');
  const allStaff = [
    { id: UUIDS.bm, pos: 'Branch_Manager', share: 30 },
    { id: UUIDS.msm, pos: 'Member_Service_Manager', share: 25 },
    { id: UUIDS.acct, pos: 'Accountant', share: 13 },
    { id: UUIDS.mso1, pos: 'Member_Service_Officer_I', share: 11 },
    { id: UUIDS.mso2, pos: 'Member_Service_Officer_II', share: 11 },
    { id: UUIDS.mso3, pos: 'Member_Service_Officer_III', share: 10 },
  ];
  for (const pc of planConfigs) {
    const planId = ;
    for (const s of allStaff) {
      const id = ;
      const individualTarget = pc.target * (s.share / 100);
      await prisma.staffPlan.upsert({
        where: { id },
        update: { individual_target: individualTarget, plan_share_percent: s.share, status: 'Active' },
        create: {
          id,
          branchPlanId: planId,
          branch_code: branchCode,
          branchId: UUIDS.branch,
          userId: s.id,
          position: s.pos,
          kpi_category: pc.kpi,
          period,
          target_type: 'incremental',
          individual_target: individualTarget,
          yearly_target: individualTarget,
          monthly_target: individualTarget / 6,
          weekly_target: individualTarget / 26,
          daily_target: individualTarget / 180,
          plan_share_percent: s.share,
          status: 'Active',
        },
      });
    }
  }

  // 5. June Balances (baseline)
  console.log('5. Creating June Balances...');
  for (const acct of AMHARIC_ACCOUNTS) {
    const baseBalance = Math.floor(Math.random() * 5000) + 500;
    const existing = await prisma.juneBalance.findFirst({ where: { account_id: acct.account, baseline_period: '2025' } });
    if (!existing) {
      await prisma.juneBalance.create({
        data: {
          account_id: acct.account,
          customer_name: acct.name,
          june_balance: baseBalance,
          baseline_period: '2025',
          baseline_date: new Date('2025-06-30'),
          is_active: true,
          importedById: UUIDS.admin,
        },
      });
    }
  }

  // 6. Account Mappings
  console.log('6. Creating Account Mappings...');
  const msoIds = [UUIDS.mso1, UUIDS.mso2, UUIDS.mso3];
  let mappingIndex = 0;
  for (const acct of AMHARIC_ACCOUNTS) {
    const assignee = msoIds[mappingIndex % 3];
    const existing = await prisma.accountMapping.findFirst({ where: { accountNumber: acct.account, branch_code: branchCode } });
    if (!existing) {
      await prisma.accountMapping.create({
        data: {
          accountNumber: acct.account,
          customerName: acct.name,
          productCategory: acct.kpi,
          branch_code: branchCode,
          branchId: UUIDS.branch,
          mappedById: UUIDS.admin,
          mappedToId: assignee,
          status: 'Active',
          assignedAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000),
        },
      });
    }
    mappingIndex++;
  }

  // 7. Daily Tasks with various statuses
  console.log('7. Creating Daily Tasks...');
  const taskTypes = ['Deposit', 'Withdrawal', 'Account Opening', 'Inquiry', 'Transfer'];
  const taskStatuses = ['pending', 'approved', 'rejected'];
  const statusWeights = [0.4, 0.35, 0.25]; // 40% pending, 35% approved, 25% rejected
  const currentMonth = new Date('2026-06-17');
  
  let taskCount = 0;
  for (let day = 0; day < 14; day++) {
    for (let t = 0; t < 4; t++) {
      const rand = Math.random();
      let status;
      if (rand < statusWeights[0]) status = 'pending';
      else if (rand < statusWeights[0] + statusWeights[1]) status = 'approved';
      else status = 'rejected';
      
      const taskDate = new Date(currentMonth);
      taskDate.setDate(taskDate.getDate() - day);
      taskDate.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      
      const acct = AMHARIC_ACCOUNTS[Math.floor(Math.random() * AMHARIC_ACCOUNTS.length)];
      const assignee = msoIds[Math.floor(Math.random() * 3)];
      const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
      const amount = (Math.floor(Math.random() * 9000) + 1000).toString();
      
      const workItem = ;
      
      const task = await prisma.dailyTask.create({
        data: {
          workItem,
          accountNumber: acct.account,
          customerName: acct.name,
          amount: parseFloat(amount),
          taskType: 'New',
          priority: Math.random() > 0.7 ? 'High' : 'Normal',
          status,
          submittedById: assignee,
          submittedAt: taskDate,
          branch_code: branchCode,
          branchId: UUIDS.branch,
          assignedToId: assignee,
          period,
        },
      });
      
      if (status === 'approved') {
        await prisma.taskApproval.create({
          data: {
            taskId: task.id,
            approverId: UUIDS.msm,
            status: 'approved',
            comment: 'Good work, completed on time.',
            createdAt: new Date(taskDate.getTime() + 3600000),
          },
        });
        await prisma.dailyTask.update({
          where: { id: task.id },
          data: { approvedAt: new Date(taskDate.getTime() + 3600000), approvedById: UUIDS.msm },
        });
      } else if (status === 'rejected') {
        const rejectReasons = ['Incorrect amount entered', 'Customer info mismatch', 'Missing signature', 'Duplicate entry'];
        await prisma.taskApproval.create({
          data: {
            taskId: task.id,
            approverId: UUIDS.msm,
            status: 'rejected',
            comment: rejectReasons[Math.floor(Math.random() * rejectReasons.length)],
            createdAt: new Date(taskDate.getTime() + 3600000),
          },
        });
        await prisma.dailyTask.update({
          where: { id: task.id },
          data: { approvedAt: new Date(taskDate.getTime() + 3600000), approvedById: UUIDS.msm },
        });
      }
      taskCount++;
    }
  }
  console.log();

  // 8. Transactions for today
  console.log('8. Creating Transactions...');
  const msoEmails = ['chaltu.desta@hawassa_main.et', 'dawit.haile@hawassa_main.et', 'eyerusalem.tesfaye@hawassa_main.et'];
  let txCount = 0;
  for (let i = 0; i < 20; i++) {
    const acct = AMHARIC_ACCOUNTS[Math.floor(Math.random() * AMHARIC_ACCOUNTS.length)];
    const amount = Math.floor(Math.random() * 5000) + 100;
    const types = ['deposit', 'withdrawal', 'transfer'];
    const txDate = new Date();
    txDate.setHours(8 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
    
    await prisma.transaction.create({
      data: {
        account_no: acct.account,
        customer_name: acct.name,
        transaction_type: types[Math.floor(Math.random() * types.length)],
        amount,
        branch_code: branchCode,
        branchId: UUIDS.branch,
        recorded_by: msoEmails[Math.floor(Math.random() * 3)],
        transaction_date: txDate,
        description: ,
      },
    });
    txCount++;
  }
  console.log();

  // 9. Performance Scores (existing staff plans auto-calc via API, but seed some manually)
  console.log('9. Creating Performance Scores...');
  const allUserIds = [UUIDS.bm, UUIDS.msm, UUIDS.acct, UUIDS.mso1, UUIDS.mso2, UUIDS.mso3];
  for (const uid of allUserIds) {
    for (const pc of planConfigs) {
      const achievement = 60 + Math.floor(Math.random() * 50);
      const existingScore = await prisma.performanceScore.findFirst({
        where: { userId: uid, period, kpi_category: pc.kpi },
      });
      if (!existingScore) {
        await prisma.performanceScore.create({
          data: {
            userId: uid,
            period,
            kpi_category: pc.kpi,
            target: pc.target * 0.2,
            actual: pc.target * 0.2 * (achievement / 100),
            achievement,
            branch_code: branchCode,
            branchId: UUIDS.branch,
            score: achievement * 0.7,
            calculatedAt: new Date(),
          },
        });
      }
    }
  }

  // 10. Plan Share Config (default)
  console.log('10. Creating Plan Share Config...');
  for (const pc of planConfigs) {
    const existing = await prisma.planShareConfig.findFirst({
      where: { kpi_category: pc.kpi, branch_code: null },
    });
    if (!existing) {
      await prisma.planShareConfig.create({
        data: {
          branch_code: null,
          kpi_category: pc.kpi,
          share_branch_manager: 30,
          share_msm: 25,
          share_accountant: 13,
          share_mso: 32,
          total_percent: 100,
          createdById: UUIDS.admin,
        },
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(' HAWASSA MOCK DATA SEEDED!');
  console.log('='.repeat(60));
  console.log('\n Login: pick user from dropdown, password: 1234');
  console.log(' Hawassa Branch: 22 accounts, 56 daily tasks, 20 transactions');

  await prisma.();
}

main().catch(e => { console.error(e); prisma.(); process.exit(1); });
