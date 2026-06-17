import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const HABESHA_CUSTOMERS = [
  { name: 'Amanuel G/Hiwot', phone: '+251911123456', accountPrefix: 'HAW' },
  { name: 'Birtukan Tadesse', phone: '+251922234567', accountPrefix: 'HAW' },
  { name: 'Chaltu Ayana', phone: '+251933345678', accountPrefix: 'HAW' },
  { name: 'Dawit Wondimu', phone: '+251944456789', accountPrefix: 'HAW' },
  { name: 'Eyerusalem Hailu', phone: '+251955567890', accountPrefix: 'HAW' },
  { name: 'Frehiwot Alemu', phone: '+251966678901', accountPrefix: 'HAW' },
  { name: 'Genet Gebre', phone: '+251977789012', accountPrefix: 'HAW' },
  { name: 'Hiwot Belayneh', phone: '+251988890123', accountPrefix: 'HAW' },
  { name: 'Kebede Molla', phone: '+251999901234', accountPrefix: 'HAW' },
  { name: 'Lemlem Desta', phone: '+251910112345', accountPrefix: 'HAW' },
  { name: 'Meseret Ayele', phone: '+251911223456', accountPrefix: 'HAW' },
  { name: 'Mekdes Worku', phone: '+251922334567', accountPrefix: 'HAW' },
  { name: 'Selam Tesfaye', phone: '+251933445678', accountPrefix: 'HAW' },
  { name: 'Tigist Haile', phone: '+251944556789', accountPrefix: 'HAW' },
  { name: 'Wubet Abebe', phone: '+251955667890', accountPrefix: 'HAW' },
  { name: 'Yordanos Tekle', phone: '+251966778901', accountPrefix: 'HAW' },
  { name: 'Zerihun Assefa', phone: '+251977889012', accountPrefix: 'HAW' },
  { name: 'Tsion Wondimu', phone: '+251988990123', accountPrefix: 'HAW' },
  { name: 'Ruth Demeke', phone: '+251999001234', accountPrefix: 'HAW' },
  { name: 'Meron Tadesse', phone: '+251910223345', accountPrefix: 'HAW' },
  { name: 'Abel Hailemariam', phone: '+251911334456', accountPrefix: 'HAW' },
  { name: 'Betelhem Assefa', phone: '+251922445567', accountPrefix: 'HAW' },
  { name: 'Saron Mamo', phone: '+251933556678', accountPrefix: 'HAW' },
  { name: 'Nahom Gebru', phone: '+251944667789', accountPrefix: 'HAW' },
  { name: 'Rahel Tekle', phone: '+251955778890', accountPrefix: 'HAW' },
  { name: 'Yonas Araya', phone: '+251966889901', accountPrefix: 'HAW' },
  { name: 'Mahlet Girma', phone: '+251977990012', accountPrefix: 'HAW' },
  { name: 'Biruk Teshome', phone: '+251988001123', accountPrefix: 'HAW' },
  { name: 'Sisay Demissie', phone: '+251999112234', accountPrefix: 'HAW' },
  { name: 'Hanna Woldemariam', phone: '+251910223345', accountPrefix: 'HAW' },
];

const BRANCH_CODE = 'HAWASSA_MAIN';

async function clearDemoData(branchId) {
  console.log('🧹 Clearing existing Hawassa demo data...');
  await prisma.performanceScore.deleteMany({ where: { branchId } });
  await prisma.behavioralEvaluation.deleteMany({ where: { branchId } });
  await prisma.evaluationApproval.deleteMany({ where: { evaluation: { branchId } } });
  await prisma.dailyTask.deleteMany({ where: { branchId } });
  await prisma.taskApproval.deleteMany({ where: { task: { branchId } } });
  await prisma.accountMapping.deleteMany({ where: { branchId } });
  const branchAccounts = HABESHA_CUSTOMERS.map(m => m.accountPrefix + m.name.slice(0, 3).toUpperCase());
  await prisma.juneBalance.deleteMany({ where: { branch_code: BRANCH_CODE } });
  console.log('✅ Cleared existing demo data');
}

function juneBal(start, increment) {
  return Array.from({ length: 30 }, (_, i) => start + i * increment);
}

async function seedJuneBalances() {
  const juneBaselines = HABESHA_CUSTOMERS.map((c, i) => ({
    account_id: `${c.accountPrefix}${String(100001 + i).slice(-6)}`,
    june_balance: 1200 + i * 280 + Math.floor(Math.random() * 500),
    baseline_period: '2025',
    baseline_date: new Date('2025-06-30'),
    is_active: true,
    branch_code: BRANCH_CODE,
  }));

  for (const jb of juneBaselines) {
    await prisma.juneBalance.upsert({
      where: { account_id_baseline_period: { account_id: jb.account_id, baseline_period: jb.baseline_period } },
      create: { ...jb, accountNumber: jb.account_id },
      update: { june_balance: jb.june_balance, is_active: true },
    });
  }
  console.log(`✅ Created ${juneBaselines.length} June baseline balances`);
  return juneBaselines;
}

async function getHawassaUsers() {
  const branch = await prisma.branch.findFirst({ where: { code: BRANCH_CODE } });
  if (!branch) throw new Error(`Branch ${BRANCH_CODE} not found. Run seedAllData first.`);

  const bm = await prisma.user.findFirst({ where: { branchId: branch.id, role: 'branchManager' } });
  const msm = await prisma.user.findFirst({ where: { branchId: branch.id, role: 'lineManager' } });
  const acct = await prisma.user.findFirst({ where: { branchId: branch.id, role: 'subTeamLeader' } });
  const msos = await prisma.user.findMany({ where: { branchId: branch.id, role: 'staff' } });

  if (!bm || !msm || !acct || msos.length === 0) {
    throw new Error('Hawassa users not found. Run seedAllData first.');
  }

  console.log(`\n👥 Found Hawassa users:`);
  console.log(`   BM: ${bm.name} (${bm.email})`);
  console.log(`   MSM: ${msm.name} (${msm.email})`);
  console.log(`   Accountant: ${acct.name} (${acct.email})`);
  console.log(`   MSOs: ${msos.map(m => m.name).join(', ')}`);

  return { branch, bm, msm, acct, msos };
}

function randomBalance(juneBal) {
  const growth = Math.floor(Math.random() * 3500) + 200;
  return { current: juneBal + growth, growth };
}

async function seedAccountMappings(branch, juneBaselines, users) {
  // Assign customers to staff: 5 to MSM, 5 to Accountant, rest split among MSOs
  const perStaff = {};
  const allStaff = [users.msm, users.acct, ...users.msos];
  const accountsPerStaff = Math.floor(HABESHA_CUSTOMERS.length / allStaff.length);
  let remainder = HABESHA_CUSTOMERS.length % allStaff.length;

  let idx = 0;
  for (const staff of allStaff) {
    const count = accountsPerStaff + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    perStaff[staff.id] = HABESHA_CUSTOMERS.slice(idx, idx + count);
    idx += count;
  }

  let created = 0;
  for (const staff of allStaff) {
    const customers = perStaff[staff.id];
    for (const c of customers) {
      const accountNumber = `${c.accountPrefix}${String(100001 + HABESHA_CUSTOMERS.indexOf(c)).slice(-6)}`;
      const jb = juneBaselines.find(j => j.account_id === accountNumber);
      const juneBal = jb?.june_balance || 1500;
      const { current, growth } = randomBalance(juneBal);

      await prisma.accountMapping.upsert({
        where: { accountNumber },
        create: {
          accountNumber,
          customerName: c.name,
          accountType: 'Savings',
          balance: current,
          current_balance: current,
          june_balance: juneBal,
          active_status: true,
          phoneNumber: c.phone,
          status: 'Active',
          mappedToId: staff.id,
          mappedById: staff.id,
          branchId: branch.id,
        },
        update: {
          customerName: c.name,
          current_balance: current,
          june_balance: juneBal,
          active_status: true,
          phoneNumber: c.phone,
          status: 'Active',
          mappedToId: staff.id,
        },
      });
      created++;
    }
  }
  console.log(`✅ Created ${created} account mappings across ${allStaff.length} staff`);
}

async function seedDailyTasks(branch, users) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const taskTypes = ['Deposit_Mobilization', 'Digital_Activation', 'Member_Registration', 'New_Customer', 'Loan_Follow_up'];
  const allStaff = [users.msm, users.acct, ...users.msos];

  // Get account mappings for each staff
  let totalTasks = 0;
  for (const staff of allStaff) {
    const mappings = await prisma.accountMapping.findMany({
      where: { mappedToId: staff.id, branchId: branch.id, status: 'Active' },
    });

    if (mappings.length === 0) continue;

    // Each staff gets 2-4 tasks today (mix of deposit, digital, etc.)
    const numTasks = 2 + Math.floor(Math.random() * 3);
    const shuffledMappings = [...mappings].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numTasks, shuffledMappings.length); i++) {
      const mapping = shuffledMappings[i];
      const taskType = taskTypes[i % taskTypes.length];
      const amount = taskType === 'Deposit_Mobilization' || taskType === 'Loan_Follow_up'
        ? Math.floor(Math.random() * 5000) + 500
        : 0;

      const taskDate = new Date(today);
      taskDate.setHours(8 + i, Math.floor(Math.random() * 60), 0, 0);

      const existingTask = await prisma.dailyTask.findFirst({
        where: {
          accountNumber: mapping.accountNumber,
          taskDate: { gte: today, lt: todayEnd },
          submittedById: staff.id,
        },
      });

      if (existingTask) continue;

      const task = await prisma.dailyTask.create({
        data: {
          taskType,
          accountNumber: mapping.accountNumber,
          accountId: mapping.id,
          amount,
          remarks: `${taskType.replace(/_/g, ' ')} - ${mapping.customerName}`,
          submittedById: staff.id,
          branchId: branch.id,
          mappingStatus: 'Mapped_to_You',
          approvalStatus: 'Approved',
          cbsValidated: true,
          cbsValidatedAt: new Date(),
          taskDate,
        },
      });

      // Create approval record
      const approverId = staff.role === 'lineManager' || staff.role === 'subTeamLeader'
        ? users.bm.id
        : (staff.role === 'staff' ? users.msm.id : users.bm.id);

      await prisma.taskApproval.create({
        data: {
          taskId: task.id,
          approverId,
          role: 'lineManager',
          status: 'Approved',
          approvedAt: new Date(),
        },
      });

      totalTasks++;
    }
  }
  console.log(`✅ Created ${totalTasks} daily tasks for today with approved status`);
  return totalTasks;
}

async function seedBehavioralEvaluations(branch, users) {
  const competencies = [
    { name: 'Communication', score: 4, maxScore: 5 },
    { name: 'Teamwork', score: 4, maxScore: 5 },
    { name: 'Problem Solving', score: 3, maxScore: 5 },
    { name: 'Adaptability', score: 4, maxScore: 5 },
    { name: 'Leadership', score: 3, maxScore: 5 },
    { name: 'Customer Focus', score: 5, maxScore: 5 },
    { name: 'Initiative', score: 4, maxScore: 5 },
    { name: 'Reliability', score: 4, maxScore: 5 },
  ];

  const maxTotal = competencies.reduce((s, c) => s + c.maxScore, 0);

  const allStaff = [users.msm, users.acct, ...users.msos];
  let count = 0;

  for (const staff of allStaff) {
    const existing = await prisma.behavioralEvaluation.findFirst({
      where: {
        evaluatedUserId: staff.id,
        branchId: branch.id,
        year: 2025,
      },
    });

    if (existing) continue;

    const variance = Math.floor(Math.random() * 5) - 2;
    const staffComp = competencies.map(c => ({
      competencyName: c.name,
      score: Math.max(1, Math.min(5, c.score + variance)),
      maxScore: c.maxScore,
    }));
    const staffTotal = staffComp.reduce((s, c) => s + c.score, 0);

    const evaluator = staff.role === 'staff' ? users.msm : users.bm;

    const evaluation = await prisma.behavioralEvaluation.create({
      data: {
        evaluatedUserId: staff.id,
        evaluatedById: evaluator.id,
        branchId: branch.id,
        period: 'Quarterly',
        year: 2025,
        quarter: 2,
        competencies: staffComp,
        totalScore: staffTotal,
        overallComments: 'Good performance this period.',
        approvalStatus: 'Approved',
      },
    });

    await prisma.evaluationApproval.create({
      data: {
        evaluationId: evaluation.id,
        approverId: users.bm.id,
        role: 'branchManager',
        status: 'Approved',
        approvedAt: new Date(),
        comments: 'Good performance this quarter.',
      },
    });

    count++;
  }
  console.log(`✅ Created ${count} behavioral evaluations with ratings`);
}

async function seedPerformanceScores(branch, users) {
  const allStaff = [users.msm, users.acct, ...users.msos];
  let count = 0;

  for (const staff of allStaff) {
    // Calculate realistic KPI scores based on their mappings
    const mappings = await prisma.accountMapping.findMany({
      where: { mappedToId: staff.id, branchId: branch.id, status: 'Active' },
    });

    const totalJune = mappings.reduce((s, m) => s + (m.june_balance || 0), 0);
    const totalCurrent = mappings.reduce((s, m) => s + (m.current_balance || 0), 0);
    const incrementalGrowth = totalCurrent - totalJune;

    // Get their staff plan for deposit
    const staffPlan = await prisma.staffPlan.findFirst({
      where: { userId: staff.id, branch_code: BRANCH_CODE, kpi_category: 'Deposit_Mobilization', status: 'Active' },
    });
    const target = staffPlan?.individual_target || 100000;
    const depositPercent = target > 0 ? Math.min((incrementalGrowth / target) * 100, 100) : 60;

    // Approved tasks
    const approvedTasks = await prisma.dailyTask.findMany({
      where: { submittedById: staff.id, branchId: branch.id, approvalStatus: 'Approved' },
    });

    const digitalCount = approvedTasks.filter(t => t.taskType === 'Digital_Activation').length;
    const memberCount = approvedTasks.filter(t => t.taskType === 'Member_Registration').length;
    const customerCount = approvedTasks.filter(t => t.taskType === 'New_Customer').length;

    // Use realistic demo scores that look good for presentation
    const demoRating = ['Outstanding', 'Very_Good', 'Good', 'Very_Good', 'Good'];
    const demoFinalScores = [92, 86, 78, 88, 81];
    const demoKpiScores = [78, 73, 66, 75, 69];
    const demoBehavioralScores = [14, 13, 12, 13, 12];
    const idx = allStaff.indexOf(staff);
    const demoIdx = idx % demoFinalScores.length;

    const kpiScores = {
      Deposit_Mobilization: { target: 150000, actual: 112500, percent: 75, weight: 25, score: 18.75 },
      Digital_Channel_Growth: { target: 8, actual: 6, percent: 75, weight: 20, score: 15 },
      Member_Registration: { target: 5, actual: 4, percent: 80, weight: 10, score: 8 },
      Customer_Base: { target: 8, actual: 6, percent: 75, weight: 15, score: 11.25 },
    };

    const finalScore = demoFinalScores[demoIdx];
    const rating = demoRating[demoIdx];

    const existingScore = await prisma.performanceScore.findFirst({
      where: { userId: staff.id, branchId: branch.id, period: 'Quarterly', year: 2025 },
    });

    if (existingScore) {
      await prisma.performanceScore.update({
        where: { id: existingScore.id },
        data: {
          kpiScores,
          kpiTotalScore: Math.round(kpiTotalScore * 100) / 100,
          behavioralScore: Math.round(behavioralScore * 100) / 100,
          behavioralEvaluationId: behavioralEval?.id,
          finalScore: Math.round(finalScore * 100) / 100,
          rating,
          status: 'Calculated',
        },
      });
    } else {
      await prisma.performanceScore.create({
        data: {
          userId: staff.id,
          branchId: branch.id,
          period: 'Quarterly',
          year: 2025,
          quarter: 2,
          month: 6,
          kpiScores,
          kpiTotalScore: Math.round(kpiTotalScore * 100) / 100,
          behavioralScore: Math.round(behavioralScore * 100) / 100,
          behavioralEvaluationId: behavioralEval?.id,
          finalScore: Math.round(finalScore * 100) / 100,
          rating,
          status: 'Calculated',
        },
      });
    }

    const percentStr = Math.round(depositPercent);
    console.log(`   ${staff.name.padEnd(20)} Deposit: ${percentStr}% | Tasks: ${approvedTasks.length} | Final Score: ${Math.round(finalScore)}% (${rating.replace(/_/g, ' ')})`);

    count++;
  }
  console.log(`✅ Created/updated ${count} performance scores`);
}

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL\n');
    console.log('='.repeat(60));
    console.log('🏗️  SEEDING HAWASSA DEMO DATA');
    console.log('='.repeat(60));

    const { branch, bm, msm, acct, msos } = await getHawassaUsers();

    await clearDemoData(branch.id);

    console.log('\n📊 Step 1: Creating June baseline balances...');
    const juneBaselines = await seedJuneBalances();

    console.log('\n📋 Step 2: Creating account mappings with Habesha customer data...');
    await seedAccountMappings(branch, juneBaselines, { bm, msm, acct, msos });

    console.log('\n📝 Step 3: Creating daily tasks for today...');
    await seedDailyTasks(branch, { bm, msm, acct, msos });

    console.log('\n📈 Step 4: Creating behavioral evaluations...');
    await seedBehavioralEvaluations(branch, { bm, msm, acct, msos });

    console.log('\n🏆 Step 5: Calculating and saving performance scores...');
    await seedPerformanceScores(branch, { bm, msm, acct, msos });

    console.log('\n' + '='.repeat(60));
    console.log('✅ HAWASSA DEMO DATA SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   Branch: Hawassa Main Branch`);
    console.log(`   Branch Manager: ${bm.name}`);
    console.log(`   MSM: ${msm.name}`);
    console.log(`   Accountant: ${acct.name}`);
    console.log(`   MSOs: ${msos.map(m => m.name).join(', ')}`);
    console.log(`   Customers: ${HABESHA_CUSTOMERS.length} mapped accounts`);
    console.log(`\n🔑 Login: use <email> / password123`);
    console.log(`   (emails are name@hawassa_main.et)`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Hawassa demo data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
