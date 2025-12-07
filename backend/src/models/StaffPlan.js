import mongoose from 'mongoose';

const staffPlanSchema = new mongoose.Schema({
  branchPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  branch_code: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
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
  },
  target_type: {
    type: String,
    required: true,
    enum: ['incremental'],
    default: 'incremental',
  },
  // Individual target (calculated from branch target * plan share %)
  individual_target: {
    type: Number,
    required: true,
    default: 0,
  },
  // Auto-calculated breakdowns
  yearly_target: {
    type: Number,
    default: 0,
  },
  monthly_target: {
    type: Number,
    default: 0,
  },
  weekly_target: {
    type: Number,
    default: 0,
  },
  daily_target: {
    type: Number,
    default: 0,
  },
  plan_share_percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Completed', 'Cancelled'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
staffPlanSchema.index({ userId: 1, kpi_category: 1, period: 1 });
staffPlanSchema.index({ branch_code: 1, period: 1 });
staffPlanSchema.index({ branchPlanId: 1 });

export default mongoose.model('StaffPlan', staffPlanSchema);

