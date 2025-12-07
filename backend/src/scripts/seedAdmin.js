import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Region from '../models/Region.js';
import Area from '../models/Area.js';
import Branch from '../models/Branch.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@sako.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create a sample region
    let region = await Region.findOne({ code: 'SOUTH' });
    if (!region) {
      region = await Region.create({
        name: 'South Region',
        code: 'SOUTH',
      });
      console.log('✅ Created South Region');
    }

    // Create a sample area
    let area = await Area.findOne({ code: 'HAWASSA_AREA' });
    if (!area) {
      area = await Area.create({
        name: 'Hawassa Area',
        code: 'HAWASSA_AREA',
        regionId: region._id,
      });
      console.log('✅ Created Hawassa Area');
    }

    // Create a sample branch
    let branch = await Branch.findOne({ code: 'HAWASSA_MAIN' });
    if (!branch) {
      branch = await Branch.create({
        name: 'Hawassa Main Branch',
        code: 'HAWASSA_MAIN',
        regionId: region._id,
        areaId: area._id,
      });
      console.log('✅ Created Hawassa Main Branch');
    }

    // Create admin user
    const admin = await User.create({
      employeeId: 'ADMIN001',
      name: 'System Administrator',
      email: 'admin@sako.com',
      password: 'admin123', // Will be hashed automatically
      role: 'SAKO HQ / Admin',
      branchId: branch._id,
      isActive: true,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('📧 Email: admin@sako.com');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

