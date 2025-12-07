import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductKpiMapping from '../models/ProductKpiMapping.js';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

dotenv.config({ path: './.env' });

// Product mappings from CSV
const productMappings = [
  { cbs_product_name: 'Felagot Saving', kpi_category: 'Deposit Mobilization' },
  { cbs_product_name: 'Digital Saving', kpi_category: 'Digital Channel Growth' },
  { cbs_product_name: 'Weekly Sa 360', kpi_category: 'Deposit Mobilization' },
  { cbs_product_name: 'Sixty Days L Sa', kpi_category: 'Loan & NPL', conditions: { min_balance: 0 } },
  { cbs_product_name: 'Thirty Days L S', kpi_category: 'Loan & NPL', conditions: { min_balance: 0 } },
  { cbs_product_name: 'Revol Loan Savi', kpi_category: 'Loan & NPL' },
  { cbs_product_name: 'Medebegna Savin', kpi_category: 'Deposit Mobilization' },
  { cbs_product_name: 'Share Account', kpi_category: 'Shareholder Recruitment' },
  { cbs_product_name: 'Non Member', kpi_category: 'Customer Base' },
  { cbs_product_name: 'Special Saving', kpi_category: 'Deposit Mobilization' },
  { cbs_product_name: 'Taxi Saving', kpi_category: 'Deposit Mobilization' },
  { cbs_product_name: 'Fixed Time 1Y', kpi_category: 'Deposit Mobilization' },
];

const seedProductMappings = async () => {
  try {
    await connectDB();

    // Get admin user (try both role formats)
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.findOne({ role: 'SAKO HQ / Admin' });
    }
    if (!admin) {
      // Try to find any user with admin in email or role
      admin = await User.findOne({ 
        $or: [
          { email: 'admin@sako.com' },
          { role: { $regex: /admin/i } }
        ]
      });
    }
    if (!admin) {
      console.error('❌ No admin user found. Please create an admin user first.');
      console.error('   Run: npm run seed');
      process.exit(1);
    }

    console.log('🌱 Seeding product mappings...\n');

    let created = 0;
    let updated = 0;

    for (const mappingData of productMappings) {
      const existing = await ProductKpiMapping.findOne({
        cbs_product_name: mappingData.cbs_product_name,
      });

      if (existing) {
        existing.kpi_category = mappingData.kpi_category;
        existing.conditions = mappingData.conditions || {};
        existing.status = 'active';
        existing.mapped_by = admin._id;
        existing.mapped_at = new Date();
        await existing.save();
        updated++;
        console.log(`✅ Updated: ${mappingData.cbs_product_name} → ${mappingData.kpi_category}`);
      } else {
        await ProductKpiMapping.create({
          ...mappingData,
          mapped_by: admin._id,
          status: 'active',
        });
        created++;
        console.log(`✅ Created: ${mappingData.cbs_product_name} → ${mappingData.kpi_category}`);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Total: ${productMappings.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding product mappings:', error);
    process.exit(1);
  }
};

seedProductMappings();

