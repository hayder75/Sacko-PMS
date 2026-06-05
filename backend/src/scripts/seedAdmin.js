import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const seedAdmin = async () => {
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL via Prisma');

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@sako.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Create a sample region
    let region = await prisma.region.findUnique({
      where: { code: 'SOUTH' },
    });

    if (!region) {
      region = await prisma.region.create({
        data: {
          name: 'South Region',
          code: 'SOUTH',
        },
      });
      console.log('✅ Created South Region');
    }

    // Create a sample area
    let area = await prisma.area.findUnique({
      where: { code: 'HAWASSA_AREA' },
    });

    if (!area) {
      area = await prisma.area.create({
        data: {
          name: 'Hawassa Area',
          code: 'HAWASSA_AREA',
          regionId: region.id,
        },
      });
      console.log('✅ Created Hawassa Area');
    }

    // Create a sample branch
    let branch = await prisma.branch.findUnique({
      where: { code: 'HAWASSA_MAIN' },
    });

    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: 'Hawassa Main Branch',
          code: 'HAWASSA_MAIN',
          regionId: region.id,
          areaId: area.id,
        },
      });
      console.log('✅ Created Hawassa Main Branch');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        employeeId: 'ADMIN001',
        name: 'System Administrator',
        email: 'admin@sako.com',
        password: hashedPassword,
        role: 'admin',
        position: 'Branch_Manager',
        branchId: branch.id,
        branch_code: branch.code,
        isActive: true,
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('📧 Email: admin@sako.com');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seedAdmin();
