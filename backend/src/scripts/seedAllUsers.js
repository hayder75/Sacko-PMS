import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Region from '../models/Region.js';
import Area from '../models/Area.js';
import Branch from '../models/Branch.js';

dotenv.config();

const seedAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    let region = await Region.findOne({ code: 'SOUTH' });
    if (!region) {
      region = await Region.create({ name: 'South Region', code: 'SOUTH' });
    }

    let area = await Area.findOne({ code: 'HAWASSA_AREA' });
    if (!area) {
      area = await Area.create({ name: 'Hawassa Area', code: 'HAWASSA_AREA', regionId: region._id });
    }

    let branch = await Branch.findOne({ code: 'HAWASSA_MAIN' });
    if (!branch) {
      branch = await Branch.create({ name: 'Hawassa Main Branch', code: 'HAWASSA_MAIN', regionId: region._id, areaId: area._id });
    }

    await User.deleteMany({});
    console.log('✅ Cleared existing users\n');

    const users = [
      { employeeId: 'ADMIN001', name: 'System Administrator', email: 'admin@sako.com', password: 'admin123', role: 'SAKO HQ / Admin', branchId: branch._id, isActive: true },
      { employeeId: 'RD001', name: 'Regional Director Test', email: 'regional@sako.com', password: 'regional123', role: 'Regional Director', branchId: branch._id, isActive: true },
      { employeeId: 'AM001', name: 'Area Manager Test', email: 'areamanager@sako.com', password: 'area123', role: 'Area Manager', branchId: branch._id, isActive: true },
      { employeeId: 'BM001', name: 'Branch Manager Test', email: 'branchmanager@sako.com', password: 'branch123', role: 'Branch Manager', branchId: branch._id, isActive: true },
      { employeeId: 'LM001', name: 'Line Manager Test', email: 'linemanager@sako.com', password: 'line123', role: 'Line Manager', branchId: branch._id, isActive: true },
      { employeeId: 'STL001', name: 'Sub-Team Leader Test', email: 'subteam@sako.com', password: 'subteam123', role: 'Sub-Team Leader', branchId: branch._id, isActive: true },
      { employeeId: 'STAFF001', name: 'Staff Member Test', email: 'staff@sako.com', password: 'staff123', role: 'Staff / MSO', branchId: branch._id, isActive: true },
    ];

    for (const userData of users) {
      await User.create(userData);
    }

    console.log('\n✅ All users created successfully!\n');
    console.log('📋 LOGIN CREDENTIALS:\n');
    console.log('SAKO HQ / Admin:     admin@sako.com | admin123');
    console.log('Regional Director:   regional@sako.com | regional123');
    console.log('Area Manager:        areamanager@sako.com | area123');
    console.log('Branch Manager:      branchmanager@sako.com | branch123');
    console.log('Line Manager:        linemanager@sako.com | line123');
    console.log('Sub-Team Leader:     subteam@sako.com | subteam123');
    console.log('Staff / MSO:        staff@sako.com | staff123');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedAllUsers();
