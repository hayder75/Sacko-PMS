import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

dotenv.config({ path: './.env' });

const listUsers = async () => {
  try {
    await connectDB();

    const users = await User.find({}).select('employeeId name email role position branch_code isActive').sort({ name: 1 });

    console.log('\n📋 Current Users in System:\n');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('No users found in the system.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'N/A'}`);
        console.log(`   Employee ID: ${user.employeeId || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Position: ${user.position || 'N/A'}`);
        console.log(`   Branch Code: ${user.branch_code || 'N/A'}`);
        console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal Users: ${users.length}\n`);

    // Show default admin credentials
    const admin = users.find(u => u.email === 'admin@sako.com' || u.role?.includes('admin'));
    if (admin) {
      console.log('🔑 Default Admin Credentials:');
      console.log('   Email: admin@sako.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  Please change password after first login!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  }
};

listUsers();

