import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Plan from '../models/Plan.js';
import { connectDB } from '../config/database.js';

// Load environment variables
dotenv.config({ path: './.env' });

const removeAllPlans = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    const countBefore = await Plan.countDocuments({});
    console.log(`📋 Found ${countBefore} plan(s) in the database`);
    
    if (countBefore === 0) {
      console.log('✅ No plans to delete.');
      await mongoose.connection.close();
      return;
    }
    
    const result = await Plan.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} plan(s) from the database.`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing plans:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

removeAllPlans();

