import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding minimal data for SAKO PMS...\n');

  // Clear existing data using Prisma client (respecting FK order)
  await prisma.evaluationApproval.deleteMany();
  await prisma.performanceScore.deleteMany();
  await prisma.behavioralEvaluation.deleteMany();
  await prisma.taskApproval.deleteMany();
  await prisma.dailyTask.deleteMany();
  await prisma.accountMapping.deleteMany();
  await prisma.juneBalance.deleteMany();
  await prisma.planShareConfig.deleteMany();
  await prisma.productKpiMapping.deleteMany();
  await prisma.staffPlan.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.subTeam.deleteMany();
  await prisma.team.deleteMany();
  // Nullify FK references before deleting users
  await prisma.region.updateMany({ where: { directorId: { not: null } }, data: { directorId: null } });
  await prisma.area.updateMany({ where: { managerId: { not: null } }, data: { managerId: null } });
  await prisma.branch.updateMany({ where: { managerId: { not: null } }, data: { managerId: null } });
  await prisma.user.deleteMany({ where: { email: { not: 'admin@sako.com' } } });
  await prisma.branch.deleteMany();
  await prisma.area.deleteMany();
  await prisma.region.deleteMany();

  const hashedPwd = await bcrypt.hash('password123', 10);

  // 1. South Region
  const region = await prisma.region.create({
    data: { name: 'South Region', code: 'SOUTH', isActive: true },
  });
  console.log('✅ South Region created');

  // 2. Hawassa Area
  const area = await prisma.area.create({
    data: { name: 'Hawassa Area', code: 'HAWASSA_AREA', regionId: region.id, isActive: true },
  });
  console.log('✅ Hawassa Area created');

  // 3. Hawassa Main Branch
  const branch = await prisma.branch.create({
    data: {
      name: 'Hawassa Main Branch',
      code: 'HAWASSA_MAIN',
      regionId: region.id,
      areaId: area.id,
      isActive: true,
    },
  });
  console.log('✅ Hawassa Main Branch created');

  // 4. Regional Director
  const rd = await prisma.user.create({
    data: {
      name: 'Getachew Lemma',
      email: 'getachew.lemma@south.gov.et',
      password: hashedPwd,
      role: 'regionalDirector',
      position: 'Regional_Director',
      employeeId: 'RD-SOUTH-001',
      regionId: region.id,
      isActive: true,
    },
  });
  await prisma.region.update({ where: { id: region.id }, data: { directorId: rd.id } });
  console.log(`✅ Regional Director: ${rd.name}`);

  // 5. Area Manager
  const am = await prisma.user.create({
    data: {
      name: 'Tadesse Woldemariam',
      email: 'tadesse.woldemariam@hawassa_area.et',
      password: hashedPwd,
      role: 'areaManager',
      position: 'Area_Manager',
      employeeId: 'AM-HAW-001',
      regionId: region.id,
      areaId: area.id,
      isActive: true,
    },
  });
  await prisma.area.update({ where: { id: area.id }, data: { managerId: am.id } });
  console.log(`✅ Area Manager: ${am.name}`);

  // 6. Branch Manager
  const bm = await prisma.user.create({
    data: {
      name: 'Abebe Tadesse',
      email: 'abebe.tadesse@hawassa_main.et',
      password: hashedPwd,
      role: 'branchManager',
      position: 'Branch_Manager',
      employeeId: 'HAWASSA_MAIN_BM001',
      branchId: branch.id,
      regionId: region.id,
      areaId: area.id,
      branch_code: 'HAWASSA_MAIN',
      isActive: true,
    },
  });
  await prisma.branch.update({ where: { id: branch.id }, data: { managerId: bm.id } });
  console.log(`✅ Branch Manager: ${bm.name}`);

  // 7. Single Staff (MSO)
  const staff = await prisma.user.create({
    data: {
      name: 'Bekele Molla',
      email: 'bekele.molla@hawassa_main.et',
      password: hashedPwd,
      role: 'staff',
      position: 'Member_Service_Officer',
      employeeId: 'HAWASSA_MAIN_STAFF001',
      branchId: branch.id,
      regionId: region.id,
      areaId: area.id,
      branch_code: 'HAWASSA_MAIN',
      isActive: true,
    },
  });
  console.log(`✅ Staff: ${staff.name}`);

  // 8. Plans
  const plans = [
    { name: 'H2-2025 Deposit Target', kpi_category: 'Deposit_Mobilization', target_value: 10000000, weight: 30 },
    { name: 'H2-2025 Digital Growth', kpi_category: 'Digital_Channel_Growth', target_value: 500, weight: 20 },
    { name: 'H2-2025 Member Registration', kpi_category: 'Member_Registration', target_value: 300, weight: 15 },
    { name: 'H2-2025 Customer Base', kpi_category: 'Customer_Base', target_value: 400, weight: 15 },
    { name: 'H2-2025 Shareholder Recruitment', kpi_category: 'Shareholder_Recruitment', target_value: 100, weight: 10 },
    { name: 'H2-2025 Loan & NPL', kpi_category: 'Loan_NPL', target_value: 5000000, weight: 10 },
  ];

  for (const plan of plans) {
    await prisma.plan.create({
      data: {
        name: plan.name,
        type: 'Branch',
        period: '2025-H2',
        branchId: branch.id,
        kpi_category: plan.kpi_category,
        target_value: plan.target_value,
        weight: plan.weight,
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-12-31'),
        status: 'Active',
      },
    });
  }
  console.log('✅ Plans created');

  // 9. Staff Plan for the single staff
  const branchPlans = await prisma.plan.findMany({ where: { branchId: branch.id } });
  for (const bp of branchPlans) {
    await prisma.staffPlan.create({
      data: {
        userId: staff.id,
        planId: bp.id,
        branchPlanId: bp.id,
        kpi_category: bp.kpi_category,
        individual_target: Math.round(bp.target_value * 0.1),
        monthly_target: Math.round(bp.target_value * 0.1 / 6),
        branch_code: 'HAWASSA_MAIN',
        status: 'Active',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-12-31'),
      },
    });
  }
  console.log('✅ Staff plans created');

  console.log(`\n============================================================`);
  console.log(`✅ MINIMAL DATA SEEDED SUCCESSFULLY!`);
  console.log(`============================================================`);
  console.log(`\n📋 LOGIN CREDENTIALS:`);
  console.log(`   Admin:              admin@sako.com / admin123`);
  console.log(`   Regional Director:  getachew.lemma@south.gov.et / password123`);
  console.log(`   Area Manager:       tadesse.woldemariam@hawassa_area.et / password123`);
  console.log(`   Branch Manager:     abebe.tadesse@hawassa_main.et / password123`);
  console.log(`   Staff:              bekele.molla@hawassa_main.et / password123`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
