import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

// Load environment variables
dotenv.config({ path: './.env' });

const removeAllUsersExceptAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find admin user(s) - check for both 'admin' and 'SAKO HQ / Admin' roles
    const adminUsers = await User.find({
      $or: [
        { role: 'admin' },
        { role: 'SAKO HQ / Admin' },
        { email: { $regex: /admin/i } },
      ],
    });

    console.log(`\n📋 Found ${adminUsers.length} admin user(s) to keep:`);
    adminUsers.forEach((admin) => {
      console.log(`  - ${admin.name} (${admin.email}) - Role: ${admin.role}`);
    });

    // Get admin IDs to exclude from deletion
    const adminIds = adminUsers.map((admin) => admin._id);

    // Count users to be deleted
    const usersToDelete = await User.countDocuments({
      _id: { $nin: adminIds },
    });

    console.log(`\n🗑️  Found ${usersToDelete} users to delete (excluding admin)`);

    if (usersToDelete === 0) {
      console.log('✅ No users to delete. Only admin user(s) exist.');
      await mongoose.connection.close();
      return;
    }

    // Delete all users except admin
    const result = await User.deleteMany({
      _id: { $nin: adminIds },
    });

    console.log(`\n✅ Successfully deleted ${result.deletedCount} user(s)`);
    console.log(`\n📊 Remaining users:`);
    const remainingUsers = await User.find({});
    remainingUsers.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
removeAllUsersExceptAdmin();

