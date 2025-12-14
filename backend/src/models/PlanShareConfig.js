import mongoose from 'mongoose';

const planShareConfigSchema = new mongoose.Schema({
  branch_code: {
    type: String,
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
  // Plan share percentages by position (official positions from plan cascad.xlsx)
  // MSO percentage is shared equally among all MSOs (I, II, III) in the branch
  planShares: {
    'Branch Manager': {
      type: Number,
      default: 30,
      min: 0,
      max: 100,
    },
    'Member Service Manager (MSM)': {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    'Accountant': {
      type: Number,
      default: 13,
      min: 0,
      max: 100,
    },
    'MSO': {
      type: Number,
      default: 32,
      min: 0,
      max: 100,
      // This percentage is divided equally among all MSOs (I, II, III) in the branch
    },
  },
  // Total must equal 100%
  total_percent: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Validate total = 100%
planShareConfigSchema.pre('save', function(next) {
  const shares = this.planShares;
  const total = Object.values(shares).reduce((sum, val) => sum + (val || 0), 0);
  this.total_percent = total;
  
  if (Math.abs(total - 100) > 0.01) {
    return next(new Error(`Plan share percentages must total 100%. Current total: ${total}%`));
  }
  next();
});

// Indexes
planShareConfigSchema.index({ branch_code: 1, kpi_category: 1 });
planShareConfigSchema.index({ kpi_category: 1, isActive: 1 });

export default mongoose.model('PlanShareConfig', planShareConfigSchema);

