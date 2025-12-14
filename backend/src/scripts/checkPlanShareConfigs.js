import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PlanShareConfig from '../models/PlanShareConfig.js';
import { connectDB } from '../config/database.js';

// Load environment variables
dotenv.config({ path: './.env' });

const checkPlanShareConfigs = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const configs = await PlanShareConfig.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ kpi_category: 1, branch_code: 1 });

    console.log(`📋 Found ${configs.length} active plan share config(s):\n`);

    if (configs.length === 0) {
      console.log('⚠️  NO PLAN SHARE CONFIGS FOUND!');
      console.log('\nYou need to create plan share configs before uploading plans.');
      console.log('Required configs:');
      console.log('  - Deposit Mobilization');
      console.log('  - Digital Channel Growth');
      console.log('  - Member Registration');
      console.log('  - Shareholder Recruitment');
      console.log('  - Loan & NPL');
      console.log('  - Customer Base');
      console.log('\nGo to Plan Share Config page in the admin UI to create them.');
    } else {
      configs.forEach((config, index) => {
        console.log(`${index + 1}. ${config.kpi_category} - ${config.branch_code || 'Default (All Branches)'}`);
        console.log(`   Total: ${config.total_percent}%`);
        console.log(`   Positions: ${Object.keys(config.planShares).join(', ')}`);
        console.log(`   Created: ${config.createdBy?.name || 'N/A'}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkPlanShareConfigs();

