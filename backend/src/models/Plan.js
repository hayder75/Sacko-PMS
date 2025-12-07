import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  branch_code: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  kpi_category: {
    type: String,
    required: true,
    enum: [
      'Deposit Mobilization',
      'Digital Channel Growth',
      'Member Registration',
      'Shareholder Recruitment',
      'Loan & NPL',
      'Customer Base',
    ],
  },
  period: {
    type: String,
    required: true,
    enum: ['2025-H2', 'Q4-2025', 'December-2025', '2025'],
  },
  target_value: {
    type: Number,
    required: true,
    default: 0,
  },
  target_type: {
    type: String,
    required: true,
    enum: ['incremental'],
    default: 'incremental',
  },
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Completed', 'Cancelled'],
    default: 'Draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
planSchema.index({ branch_code: 1, kpi_category: 1, period: 1 });
planSchema.index({ branch_code: 1, period: 1 });
planSchema.index({ status: 1 });

export default mongoose.model('Plan', planSchema);

