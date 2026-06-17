import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const KPI = {
  DEPOSIT: 'Deposit_Mobilization',
  DIGITAL: 'Digital_Channel_Growth',
  MEMBER: 'Member_Registration',
  SHAREHOLDER: 'Shareholder_Recruitment',
  LOAN_NPL: 'Loan_NPL',
  CUSTOMER: 'Customer_Base',
};

const PLAN_PERIOD = '2025-H2';

const REGIONS = [
  { name: 'South Region', code: 'SOUTH' },
  { name: 'North Region', code: 'NORTH' },
  { name: 'East Region', code: 'EAST' },
  { name: 'West Region', code: 'WEST' },
  { name: 'Central Region', code: 'CENTRAL' },
];

const AREAS = [
  { name: 'Hawassa Area', code: 'HAWASSA_AREA', regionCode: 'SOUTH' },
  { name: 'Mekelle Area', code: 'MEKELLE_AREA', regionCode: 'NORTH' },
  { name: 'Dire Dawa Area', code: 'DIRE_DAWA_AREA', regionCode: 'EAST' },
  { name: 'Jimma Area', code: 'JIMMA_AREA', regionCode: 'WEST' },
  { name: 'Addis Ababa Area', code: 'ADDIS_ABABA_AREA', regionCode: 'CENTRAL' },
];

const BRANCHES = [
  { name: 'Hawassa Main Branch', code: 'HAWASSA_MAIN', regionCode: 'SOUTH', areaCode: 'HAWASSA_AREA' },
  { name: 'Atote Branch', code: 'ATOTE', regionCode: 'SOUTH', areaCode: 'HAWASSA_AREA' },
  { name: 'Mekelle Main Branch', code: 'MEKELLE_MAIN', regionCode: 'NORTH', areaCode: 'MEKELLE_AREA' },
  { name: 'Adigrat Branch', code: 'ADIGRAT', regionCode: 'NORTH', areaCode: 'MEKELLE_AREA' },
  { name: 'Dire Dawa Main Branch', code: 'DIRE_DAWA_MAIN', regionCode: 'EAST', areaCode: 'DIRE_DAWA_AREA' },
  { name: 'Harar Branch', code: 'HARAR', regionCode: 'EAST', areaCode: 'DIRE_DAWA_AREA' },
  { name: 'Jimma Main Branch', code: 'JIMMA_MAIN', regionCode: 'WEST', areaCode: 'JIMMA_AREA' },
  { name: 'Nekemte Branch', code: 'NEKEMTE', regionCode: 'WEST', areaCode: 'JIMMA_AREA' },
  { name: 'Addis Ababa Main Branch', code: 'ADDIS_ABABA_MAIN', regionCode: 'CENTRAL', areaCode: 'ADDIS_ABABA_AREA' },
  { name: 'Bole Branch', code: 'BOLE', regionCode: 'CENTRAL', areaCode: 'ADDIS_ABABA_AREA' },
  { name: 'Debre Zeit Branch', code: 'DEBRE_ZEIT', regionCode: 'CENTRAL', areaCode: 'ADDIS_ABABA_AREA' },
];

const USERS_BY_BRANCH = {
  HAWASSA_MAIN: {
    bm: { name: 'Abebe Tadesse', employeeId: 'HAWASSA_MAIN_BM001' },
    msm: { name: 'Bekele Molla', employeeId: 'HAWASSA_MAIN_MSM001' },
    acct: { name: 'Almaz Worku', employeeId: 'HAWASSA_MAIN_ACC001' },
    msos: [
      { name: 'Chaltu Desta', employeeId: 'HAWASSA_MAIN_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Dawit Haile', employeeId: 'HAWASSA_MAIN_MSO002', position: 'Member_Service_Officer_II' },
      { name: 'Eyerusalem Tesfaye', employeeId: 'HAWASSA_MAIN_MSO003', position: 'Member_Service_Officer_III' },
    ],
  },
  ATOTE: {
    bm: { name: 'Tekle Gebremariam', employeeId: 'ATOTE_BM001' },
    msm: { name: 'Selam Teshome', employeeId: 'ATOTE_MSM001' },
    acct: { name: 'Henok Assefa', employeeId: 'ATOTE_ACC001' },
    msos: [
      { name: 'Frehiwot Girma', employeeId: 'ATOTE_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Genet Abebe', employeeId: 'ATOTE_MSO002', position: 'Member_Service_Officer_II' },
      { name: 'Hiwot Belay', employeeId: 'ATOTE_MSO003', position: 'Member_Service_Officer_III' },
    ],
  },
  MEKELLE_MAIN: {
    bm: { name: 'Yonas Hagos', employeeId: 'MEKELLE_MAIN_BM001' },
    msm: { name: 'Tirunesh Desta', employeeId: 'MEKELLE_MAIN_MSM001' },
    acct: { name: 'Gebrehiwot Araya', employeeId: 'MEKELLE_MAIN_ACC001' },
    msos: [
      { name: 'Kidist Hailu', employeeId: 'MEKELLE_MAIN_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Lemlem Gebre', employeeId: 'MEKELLE_MAIN_MSO002', position: 'Member_Service_Officer_II' },
      { name: 'Mekdes Kahsay', employeeId: 'MEKELLE_MAIN_MSO003', position: 'Member_Service_Officer_III' },
      { name: 'Seble Weldemariam', employeeId: 'MEKELLE_MAIN_MSO004', position: 'Member_Service_Officer_I' },
    ],
  },
  ADIGRAT: {
    bm: { name: 'Tesfaye Girmay', employeeId: 'ADIGRAT_BM001' },
    msm: { name: 'Makeda Tekle', employeeId: 'ADIGRAT_MSM001' },
    acct: { name: 'Amanuel Berhe', employeeId: 'ADIGRAT_ACC001' },
    msos: [
      { name: 'Tsion Wolde', employeeId: 'ADIGRAT_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Yordanos Tekle', employeeId: 'ADIGRAT_MSO002', position: 'Member_Service_Officer_II' },
    ],
  },
  DIRE_DAWA_MAIN: {
    bm: { name: 'Dawit Eshetu', employeeId: 'DIRE_DAWA_MAIN_BM001' },
    msm: { name: 'Mahlet Girma', employeeId: 'DIRE_DAWA_MAIN_MSM001' },
    acct: { name: 'Solomon Hailu', employeeId: 'DIRE_DAWA_MAIN_ACC001' },
    msos: [
      { name: 'Birtukan Mamo', employeeId: 'DIRE_DAWA_MAIN_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Eleni Yeshitla', employeeId: 'DIRE_DAWA_MAIN_MSO002', position: 'Member_Service_Officer_II' },
      { name: 'Fikirte Adane', employeeId: 'DIRE_DAWA_MAIN_MSO003', position: 'Member_Service_Officer_III' },
      { name: 'Gennet Worku', employeeId: 'DIRE_DAWA_MAIN_MSO004', position: 'Member_Service_Officer_I' },
    ],
  },
  HARAR: {
    bm: { name: 'Berhanu Mohammed', employeeId: 'HARAR_BM001' },
    msm: { name: 'Rahel Abdulahi', employeeId: 'HARAR_MSM001' },
    acct: { name: 'Kebede Ahmed', employeeId: 'HARAR_ACC001' },
    msos: [
      { name: 'Saba Hassen', employeeId: 'HARAR_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Wubet Ali', employeeId: 'HARAR_MSO002', position: 'Member_Service_Officer_II' },
      { name: 'Misrak Jemal', employeeId: 'HARAR_MSO003', position: 'Member_Service_Officer_III' },
    ],
  },
  JIMMA_MAIN: {
    bm: { name: 'Getachew Demeke', employeeId: 'JIMMA_MAIN_BM001' },
    msm: { name: 'Aster Abayneh', employeeId: 'JIMMA_MAIN_MSM001' },
    acct: { name: 'Lemma Dibaba', employeeId: 'JIMMA_MAIN_ACC001' },
    msos: [
      { name: 'Bontu Olani', employeeId: 'JIMMA_MAIN_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Tsigereda Bekele', employeeId: 'JIMMA_MAIN_MSO002', position: 'Member_Service_Officer_II' },
      { name: 'Meron Tesfaye', employeeId: 'JIMMA_MAIN_MSO003', position: 'Member_Service_Officer_III' },
    ],
  },
  NEKEMTE: {
    bm: { name: 'Tolosa Bayisa', employeeId: 'NEKEMTE_BM001' },
    msm: { name: 'Worknesh Tola', employeeId: 'NEKEMTE_MSM001' },
    acct: { name: 'Fikru Merga', employeeId: 'NEKEMTE_ACC001' },
    msos: [
      { name: 'Belaynesh Wakjira', employeeId: 'NEKEMTE_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Chala Olani', employeeId: 'NEKEMTE_MSO002', position: 'Member_Service_Officer_II' },
    ],
  },
  ADDIS_ABABA_MAIN: {
    bm: { name: 'Mesfin Belachew', employeeId: 'ADDIS_ABABA_MAIN_BM001' },
    msm: { name: 'Tsion Tadesse', employeeId: 'ADDIS_ABABA_MAIN_MSM001' },
    acct: { name: 'Yohannes Gebremedhin', employeeId: 'ADDIS_ABABA_MAIN_ACC001' },
    msos: [
      { name: 'Rahel Tekle', employeeId: 'ADDIS_ABABA_MAIN_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Bisrat Wondimu', employeeId: 'ADDIS_ABABA_MAIN_MSO002', position: 'Member_Service_Officer_II' },
      { name: 'Mahlet Assefa', employeeId: 'ADDIS_ABABA_MAIN_MSO003', position: 'Member_Service_Officer_III' },
      { name: 'Saron Hailu', employeeId: 'ADDIS_ABABA_MAIN_MSO004', position: 'Member_Service_Officer_I' },
      { name: 'Betelhem Abate', employeeId: 'ADDIS_ABABA_MAIN_MSO005', position: 'Member_Service_Officer_II' },
    ],
  },
  BOLE: {
    bm: { name: 'Henok Zewde', employeeId: 'BOLE_BM001' },
    msm: { name: 'Makeda Kebede', employeeId: 'BOLE_MSM001' },
    acct: { name: 'Nahom Ayele', employeeId: 'BOLE_ACC001' },
    msos: [
      { name: 'Rediet Desta', employeeId: 'BOLE_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Selamawit Mamo', employeeId: 'BOLE_MSO002', position: 'Member_Service_Officer_II' },
      { name: 'Yonas Ayele', employeeId: 'BOLE_MSO003', position: 'Member_Service_Officer_III' },
    ],
  },
  DEBRE_ZEIT: {
    bm: { name: 'Tesfaye Mekuria', employeeId: 'DEBRE_ZEIT_BM001' },
    msm: { name: 'Genet Wondimu', employeeId: 'DEBRE_ZEIT_MSM001' },
    acct: { name: 'Getnet Assefa', employeeId: 'DEBRE_ZEIT_ACC001' },
    msos: [
      { name: 'Tigist Hailemariam', employeeId: 'DEBRE_ZEIT_MSO001', position: 'Member_Service_Officer_I' },
      { name: 'Yetnayet Ayalew', employeeId: 'DEBRE_ZEIT_MSO002', position: 'Member_Service_Officer_II' },
    ],
  },
};

const PRODUCT_MAPPINGS = [
  { cbs_product_name: 'Medbegna Saving', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'Felagot Saving', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'Special Saving', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'Super Saving', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'Candidet Saving', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'Children Saving', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'IFB Saving', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'Fixed Time 1Y', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'Weekly Sa 360', kpi_category: KPI.DEPOSIT },
  { cbs_product_name: 'Sixty Days L Sa', kpi_category: KPI.LOAN_NPL },
  { cbs_product_name: 'Thirty Days L S', kpi_category: KPI.LOAN_NPL },
  { cbs_product_name: 'Revol Loan Savi', kpi_category: KPI.LOAN_NPL },
  { cbs_product_name: 'Digital Saving', kpi_category: KPI.DIGITAL },
  { cbs_product_name: 'Share Account', kpi_category: KPI.SHAREHOLDER },
  { cbs_product_name: 'Non Member', kpi_category: KPI.CUSTOMER },
  { cbs_product_name: 'Taxi Saving', kpi_category: KPI.DEPOSIT },
];

const PLAN_CONFIGS = [
  { kpi_category: KPI.DEPOSIT, target: 1000000 },
  { kpi_category: KPI.DIGITAL, target: 50 },
  { kpi_category: KPI.MEMBER, target: 20 },
  { kpi_category: KPI.CUSTOMER, target: 30 },
];

const SHARE_CONFIGS = [
  { kpi_category: KPI.DEPOSIT, bm: 30, msm: 25, acct: 13, mso: 32 },
  { kpi_category: KPI.DIGITAL, bm: 30, msm: 25, acct: 13, mso: 32 },
  { kpi_category: KPI.MEMBER, bm: 30, msm: 25, acct: 13, mso: 32 },
  { kpi_category: KPI.SHAREHOLDER, bm: 30, msm: 25, acct: 13, mso: 32 },
  { kpi_category: KPI.LOAN_NPL, bm: 30, msm: 25, acct: 13, mso: 32 },
  { kpi_category: KPI.CUSTOMER, bm: 30, msm: 25, acct: 13, mso: 32 },
];

function getEmail(name, branchCode) {
  const local = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  return `${local}@${branchCode.toLowerCase()}.et`;
}

function generatePassword() {
  return 'password123';
}

async function clearExistingData() {
  console.log('🗑️  Clearing existing data...');

  await prisma.subTeam.deleteMany();
  await prisma.team.deleteMany();
  await prisma.staffPlan.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.accountMapping.deleteMany();
  await prisma.dailyTask.deleteMany();
  await prisma.taskApproval.deleteMany();
  await prisma.juneBalance.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.productKpiMapping.deleteMany();
  await prisma.planShareConfig.deleteMany();
  await prisma.performanceScore.deleteMany();
  await prisma.behavioralEvaluation.deleteMany();
  await prisma.evaluationApproval.deleteMany();
  await prisma.cBSDiscrepancy.deleteMany();
  await prisma.cBSValidation.deleteMany();
  await prisma.transaction.deleteMany();

  await prisma.branch.updateMany({ data: { managerId: null } });
  await prisma.area.updateMany({ data: { managerId: null } });
  await prisma.region.updateMany({ data: { directorId: null } });

  await prisma.user.deleteMany({ where: { email: { not: 'admin@sako.com' } } });
  await prisma.branch.deleteMany();
  await prisma.area.deleteMany();
  await prisma.region.deleteMany();

  console.log('✅ Existing data cleared (admin user preserved)\n');
}

async function seedAdminUser() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@sako.com' } });
  if (existing) {
    console.log('ℹ️  Admin user already exists: admin@sako.com');
    return existing;
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.create({
    data: {
      employeeId: 'ADMIN001',
      name: 'System Administrator',
      email: 'admin@sako.com',
      password: hashed,
      role: 'admin',
      position: 'Branch_Manager',
      isActive: true,
    },
  });
  console.log('✅ Admin user created: admin@sako.com / admin123');
  return admin;
}

async function seedRegions() {
  const created = {};
  for (const r of REGIONS) {
    const region = await prisma.region.upsert({
      where: { code: r.code },
      update: { name: r.name },
      create: { name: r.name, code: r.code },
    });
    created[r.code] = region;
  }
  console.log(`✅ ${REGIONS.length} regions created`);
  return created;
}

async function seedAreas(regionMap) {
  const created = {};
  for (const a of AREAS) {
    const area = await prisma.area.upsert({
      where: { code: a.code },
      update: { name: a.name, regionId: regionMap[a.regionCode].id },
      create: { name: a.name, code: a.code, regionId: regionMap[a.regionCode].id },
    });
    created[a.code] = area;
  }
  console.log(`✅ ${AREAS.length} areas created`);
  return created;
}

async function seedBranches(regionMap, areaMap) {
  const created = {};
  for (const b of BRANCHES) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: {
        name: b.name,
        regionId: regionMap[b.regionCode].id,
        areaId: areaMap[b.areaCode].id,
      },
      create: {
        name: b.name,
        code: b.code,
        regionId: regionMap[b.regionCode].id,
        areaId: areaMap[b.areaCode].id,
      },
    });
    created[b.code] = branch;
  }
  console.log(`✅ ${BRANCHES.length} branches created`);
  return created;
}

async function seedUsers(branchMap, regionMap, areaMap) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(generatePassword(), salt);

  const allUsers = {};
  let total = 0;

  for (const branchCode of Object.keys(USERS_BY_BRANCH)) {
    const branchData = USERS_BY_BRANCH[branchCode];
    const branch = branchMap[branchCode];
    const branchRegion = BRANCHES.find(b => b.code === branchCode);
    const region = regionMap[branchRegion.regionCode];
    const area = areaMap[branchRegion.areaCode];

    const branchUsers = {};

    const createUser = async (data) => {
      const email = getEmail(data.name, branchCode);
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        branchUsers[data.employeeId] = existing;
        return existing;
      }
      const user = await prisma.user.create({
        data: {
          employeeId: data.employeeId,
          name: data.name,
          email,
          password: hashedPassword,
          role: data.role,
          position: data.position,
          branchId: branch.id,
          branch_code: branchCode,
          regionId: region.id,
          areaId: area.id,
          isActive: true,
        },
      });
      branchUsers[data.employeeId] = user;
      return user;
    };

    const bm = await createUser({
      employeeId: branchData.bm.employeeId,
      name: branchData.bm.name,
      role: 'branchManager',
      position: 'Branch_Manager',
    });

    const msm = await createUser({
      employeeId: branchData.msm.employeeId,
      name: branchData.msm.name,
      role: 'lineManager',
      position: 'Member_Service_Manager',
    });

    const acct = await createUser({
      employeeId: branchData.acct.employeeId,
      name: branchData.acct.name,
      role: 'subTeamLeader',
      position: 'Accountant',
    });

    const msos = [];
    for (const m of branchData.msos) {
      const mso = await createUser({
        employeeId: m.employeeId,
        name: m.name,
        role: 'staff',
        position: m.position,
      });
      msos.push(mso);
    }

    await prisma.branch.update({
      where: { id: branch.id },
      data: { managerId: bm.id },
    });

    branchUsers.bm = bm;
    branchUsers.msm = msm;
    branchUsers.acct = acct;
    branchUsers.msos = msos;
    allUsers[branchCode] = branchUsers;
    total += 2 + branchData.msos.length;
  }

  console.log(`✅ ${total} users created across ${Object.keys(USERS_BY_BRANCH).length} branches`);
  return allUsers;
}

async function seedTeamsAndSubTeams(branchMap, allUsers) {
  for (const branchCode of Object.keys(USERS_BY_BRANCH)) {
    const branch = branchMap[branchCode];
    const users = allUsers[branchCode];

    const team = await prisma.team.upsert({
      where: { code: `${branchCode}-TEAM1` },
      update: { managerId: users.msm.id },
      create: {
        name: `${branch.name} Team 1`,
        code: `${branchCode}-TEAM1`,
        branchId: branch.id,
        managerId: users.msm.id,
      },
    });

    const memberIds = [users.acct.id, ...users.msos.map(m => m.id)];

    const existingSubTeam = await prisma.subTeam.findUnique({
      where: { code: `${branchCode}-SUBTEAM1` },
    });

    if (existingSubTeam) {
      await prisma.subTeam.update({
        where: { id: existingSubTeam.id },
        data: {
          leaderId: users.acct.id,
          members: { set: memberIds.map(id => ({ id })) },
        },
      });
    } else {
      await prisma.subTeam.create({
        data: {
          name: `${branch.name} Sub-Team 1`,
          code: `${branchCode}-SUBTEAM1`,
          teamId: team.id,
          branchId: branch.id,
          leaderId: users.acct.id,
          members: { connect: memberIds.map(id => ({ id })) },
        },
      });
    }
  }

  console.log('✅ Teams and sub-teams created for all branches');
}

async function seedPlans(branchMap, allUsers) {
  let planCount = 0;
  for (const branchCode of Object.keys(USERS_BY_BRANCH)) {
    const branch = branchMap[branchCode];
    const users = allUsers[branchCode];

    for (const pc of PLAN_CONFIGS) {
      const planId = `${branchCode}_${pc.kpi_category}_${PLAN_PERIOD}`;
      const existingPlan = await prisma.plan.findUnique({ where: { id: planId } });
      if (existingPlan) {
        await prisma.plan.update({
          where: { id: planId },
          data: {
            target_value: pc.target,
            status: 'Active',
          },
        });
      } else {
        await prisma.plan.create({
          data: {
            id: planId,
            branch_code: branchCode,
            branchId: branch.id,
            kpi_category: pc.kpi_category,
            period: PLAN_PERIOD,
            target_value: pc.target,
            target_type: 'incremental',
            status: 'Active',
            createdById: users.bm.id,
          },
        });
      }
      planCount++;
    }
  }
  console.log(`✅ ${planCount} plans created`);
}

async function seedStaffPlans(branchMap, allUsers) {
  const shareByRole = { bm: 30, msm: 25, acct: 13, mso: 32 };
  let count = 0;

  for (const branchCode of Object.keys(USERS_BY_BRANCH)) {
    const branch = branchMap[branchCode];
    const users = allUsers[branchCode];
    const numMsos = users.msos.length;
    const msoShareEach = numMsos > 0 ? (shareByRole.mso / numMsos) : 0;

    const roleUsers = [
      { user: users.bm, share: shareByRole.bm, position: 'Branch_Manager' },
      { user: users.msm, share: shareByRole.msm, position: 'Member_Service_Manager' },
      { user: users.acct, share: shareByRole.acct, position: 'Accountant' },
      ...users.msos.map((m, i) => ({
        user: m,
        share: msoShareEach,
        position: USERS_BY_BRANCH[branchCode].msos[i].position,
      })),
    ];

    for (const pc of PLAN_CONFIGS) {
      const planId = `${branchCode}_${pc.kpi_category}_${PLAN_PERIOD}`;
      for (const ru of roleUsers) {
        const staffPlanId = `${planId}_${ru.user.employeeId}`;
        const individualTarget = pc.target * (ru.share / 100);

        const existing = await prisma.staffPlan.findUnique({ where: { id: staffPlanId } });
        if (existing) {
          await prisma.staffPlan.update({
            where: { id: staffPlanId },
            data: {
              individual_target: individualTarget,
              plan_share_percent: ru.share,
              status: 'Active',
            },
          });
        } else {
          await prisma.staffPlan.create({
            data: {
              id: staffPlanId,
              branchPlanId: planId,
              branch_code: branchCode,
              branchId: branch.id,
              userId: ru.user.id,
              position: ru.position,
              kpi_category: pc.kpi_category,
              period: PLAN_PERIOD,
              target_type: 'incremental',
              individual_target: individualTarget,
              yearly_target: individualTarget,
              monthly_target: individualTarget / 6,
              weekly_target: individualTarget / 26,
              daily_target: individualTarget / 180,
              plan_share_percent: ru.share,
              status: 'Active',
            },
          });
        }
        count++;
      }
    }
  }
  console.log(`✅ ${count} staff plans created`);
}

async function seedProductMappings() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@sako.com' } });
  let created = 0;
  let updated = 0;
  for (const pm of PRODUCT_MAPPINGS) {
    const existing = await prisma.productKpiMapping.findUnique({
      where: { cbs_product_name: pm.cbs_product_name },
    });
    if (existing) {
      await prisma.productKpiMapping.update({
        where: { cbs_product_name: pm.cbs_product_name },
        data: {
          kpi_category: pm.kpi_category,
          status: 'active',
          mappedById: admin.id,
        },
      });
      updated++;
    } else {
      await prisma.productKpiMapping.create({
        data: {
          cbs_product_name: pm.cbs_product_name,
          kpi_category: pm.kpi_category,
          mappedById: admin.id,
          status: 'active',
        },
      });
      created++;
    }
  }
  console.log(`✅ Product-KPI mappings: ${created} created, ${updated} updated`);
}

async function seedPlanShareConfigs() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@sako.com' } });
  for (const sc of SHARE_CONFIGS) {
    const existing = await prisma.planShareConfig.findFirst({
      where: {
        kpi_category: sc.kpi_category,
        branch_code: null,
      },
    });
    if (existing) {
      await prisma.planShareConfig.update({
        where: { id: existing.id },
        data: {
          share_branch_manager: sc.bm,
          share_msm: sc.msm,
          share_accountant: sc.acct,
          share_mso: sc.mso,
          total_percent: 100,
          updatedById: admin.id,
        },
      });
    } else {
      await prisma.planShareConfig.create({
        data: {
          branch_code: null,
          kpi_category: sc.kpi_category,
          share_branch_manager: sc.bm,
          share_msm: sc.msm,
          share_accountant: sc.acct,
          share_mso: sc.mso,
          total_percent: 100,
          createdById: admin.id,
        },
      });
    }
  }
  console.log('✅ Plan share configs created (BM 30%, MSM 25%, Acct 13%, MSO 32%)');
}

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL\n');

    console.log('='.repeat(60));
    console.log('🚀 SAKO PMS - FULL DATA SEED');
    console.log('='.repeat(60));

    await clearExistingData();
    await seedAdminUser();

    const regionMap = await seedRegions();
    const areaMap = await seedAreas(regionMap);
    const branchMap = await seedBranches(regionMap, areaMap);
    const allUsers = await seedUsers(branchMap, regionMap, areaMap);
    await seedTeamsAndSubTeams(branchMap, allUsers);
    await seedPlans(branchMap, allUsers);
    await seedStaffPlans(branchMap, allUsers);
    await seedProductMappings();
    await seedPlanShareConfigs();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DATA SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   Admin:         admin@sako.com / admin123');
    console.log('   All others:    <name>@<branchcode>.et / password123\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
