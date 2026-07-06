import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TASK_TYPES = [
  'Deposit_Mobilization', 'New_Member_Registration', 'New_Account_Opening',
  'Share_Capital', 'Mobile_Banking_Activation', 'Merchant_POS_Activation',
  'Biller_Recruitment', 'Transaction_Processing', 'SMS_Alert_Config',
  'Complaint_Resolution',
];

const AMOUNT_TYPES = ['Deposit_Mobilization', 'Share_Capital', 'Transaction_Processing'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function main() {
  console.log('🌱 Seeding supervisor daily data...\n');

  const branch = await prisma.branch.findFirst({ where: { code: 'WOLAYTA_SODO' } });
  if (!branch) { console.log('Branch not found'); return; }

  const branchManager = await prisma.user.findFirst({ where: { branchId: branch.id, role: 'branchManager' } });

  const supervisors = await prisma.user.findMany({
    where: { branchId: branch.id, isActive: true, role: 'supervisor' },
    select: { id: true, name: true, position: true },
  });

  console.log(`Found ${supervisors.length} supervisors`);

  let totalTasks = 0;

  for (const sup of supervisors) {
    // Copy some accounts from their supervisees to this supervisor
    const supervisees = await prisma.user.findMany({
      where: { supervisorId: sup.id, isActive: true },
      select: { id: true },
    });
    const superviseeIds = supervisees.map(s => s.id);

    const existingSupAccounts = await prisma.accountMapping.count({ where: { mappedToId: sup.id, status: 'Active' } });
    if (existingSupAccounts === 0 && superviseeIds.length > 0) {
      const staffAccounts = await prisma.accountMapping.findMany({
        where: { mappedToId: { in: superviseeIds }, status: 'Active' },
        take: 5,
      });
      for (const acc of staffAccounts) {
        const exists = await prisma.accountMapping.findFirst({
          where: { accountNumber: acc.accountNumber, mappedToId: sup.id },
        });
        if (!exists) {
          await prisma.accountMapping.create({
            data: {
              accountNumber: acc.accountNumber,
              customerName: acc.customerName,
              product: acc.product,
              accountType: acc.accountType,
              mappedToId: sup.id,
              branchId: branch.id,
              mappedById: acc.mappedById,
              status: 'Active',
              balance: 0,
              june_balance: 0,
              current_balance: 0,
            },
          });
        }
      }
    }

    // Get or create accounts for the supervisor
    const supAccounts = await prisma.accountMapping.findMany({
      where: { mappedToId: sup.id, status: 'Active' },
      select: { id: true, accountNumber: true, customerName: true },
    });

    if (supAccounts.length === 0) {
      console.log(`  ${sup.name}: no accounts mapped, skipping tasks`);
      continue;
    }

    console.log(`  ${sup.name}: ${supAccounts.length} accounts`);

    // Create tasks for past 15 days
    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const taskDate = new Date();
      taskDate.setDate(taskDate.getDate() - dayOffset);
      taskDate.setHours(0, 0, 0, 0);
      const dayEnd = new Date(taskDate);
      dayEnd.setHours(23, 59, 59, 999);

      const existingCount = await prisma.dailyTask.count({
        where: { submittedById: sup.id, taskDate: { gte: taskDate, lt: dayEnd } },
      });
      if (existingCount > 0) continue;

      const numTasks = randomInt(1, Math.min(3, supAccounts.length));
      const usedAccounts = new Set();

      for (let i = 0; i < numTasks; i++) {
        let acct;
        let attempts = 0;
        do {
          acct = supAccounts[randomInt(0, supAccounts.length - 1)];
          attempts++;
        } while (usedAccounts.has(acct.id) && attempts < 10);
        usedAccounts.add(acct.id);

        const taskType = TASK_TYPES[randomInt(0, TASK_TYPES.length - 1)];
        const amount = AMOUNT_TYPES.includes(taskType) ? randomInt(500, 15000) : 0;
        const approvalStatus = Math.random() < 0.8 ? 'Approved' : 'Pending';
        const taskTime = new Date(taskDate);
        taskTime.setHours(randomInt(8, 17), randomInt(0, 59), 0, 0);

        const task = await prisma.dailyTask.create({
          data: {
            taskType,
            accountNumber: acct.accountNumber,
            accountId: acct.id,
            amount,
            remarks: `${taskType.replace(/_/g, ' ')} - ${acct.customerName}`,
            submittedById: sup.id,
            branchId: branch.id,
            mappingStatus: 'Mapped_to_You',
            approvalStatus,
            cbsValidated: approvalStatus === 'Approved',
            cbsValidatedAt: approvalStatus === 'Approved' ? taskTime : null,
            taskDate: taskTime,
          },
        });

        if (approvalStatus === 'Approved' && branchManager) {
          await prisma.taskApproval.create({
            data: {
              taskId: task.id,
              approverId: branchManager.id,
              role: 'branchManager',
              status: 'Approved',
              approvedAt: taskTime,
            },
          });
        }

        totalTasks++;
      }
    }
    console.log(`  ✅ Seeded tasks for ${sup.name}`);
  }

  console.log(`\n✅ SEEDED ${totalTasks} SUPERVISOR TASKS`);
  console.log(`📅 Past 14 days + today`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
