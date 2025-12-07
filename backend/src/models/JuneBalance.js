import mongoose from 'mongoose';

const juneBalanceSchema = new mongoose.Schema({
  account_id: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  accountNumber: {
    type: String,
    trim: true,
    index: true,
  },
  june_balance: {
    type: Number,
    required: true,
    default: 0,
  },
  branch_code: {
    type: String,
    trim: true,
  },
  baseline_period: {
    type: String,
    required: true,
    trim: true,
    index: true,
    default: '2025',
  },
  baseline_date: {
    type: Date,
    required: true,
    index: true,
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true,
  },
  importedAt: {
    type: Date,
    default: Date.now,
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Compound unique index: account_id + baseline_period (allows multiple baselines per account)
juneBalanceSchema.index({ account_id: 1, baseline_period: 1 }, { unique: true });
juneBalanceSchema.index({ accountNumber: 1, baseline_period: 1 });
juneBalanceSchema.index({ branch_code: 1 });
juneBalanceSchema.index({ baseline_period: 1, is_active: 1 });

export default mongoose.model('JuneBalance', juneBalanceSchema);

