import mongoose from 'mongoose';

const accountMappingSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  accountType: {
    type: String,
    required: true,
    enum: ['Savings', 'Current', 'Fixed Deposit', 'Recurring Deposit', 'Loan'],
  },
  balance: {
    type: Number,
    default: 0,
  },
  june_balance: {
    type: Number,
    default: 0,
  },
  current_balance: {
    type: Number,
    default: 0,
  },
  active_status: {
    type: Boolean,
    default: false,
  },
  last_transaction_date: {
    type: Date,
  },
  // Mapping assignment
  mappedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  // Mapping metadata
  mappedAt: {
    type: Date,
    default: Date.now,
  },
  mappedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Auto-balance mapping flag
  isAutoBalanced: {
    type: Boolean,
    default: false,
  },
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Transferred'],
    default: 'Active',
  },
  // Notes
  notes: {
    type: String,
    trim: true,
  },
  // Customer phone number
  phoneNumber: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
accountMappingSchema.index({ mappedTo: 1, branchId: 1, status: 1 });
accountMappingSchema.index({ accountNumber: 1 });

export default mongoose.model('AccountMapping', accountMappingSchema);

