import mongoose from 'mongoose';

const dailyTaskSchema = new mongoose.Schema({
  taskType: {
    type: String,
    required: true,
    enum: [
      'Deposit Mobilization',
      'Loan Follow-up',
      'New Customer',
      'Digital Activation',
      'Member Registration',
      'Shareholder Recruitment',
    ],
  },
  productType: {
    type: String,
    trim: true,
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountMapping',
  },
  amount: {
    type: Number,
    default: 0,
  },
  remarks: {
    type: String,
    trim: true,
  },
  evidence: {
    type: String, // File path or URL
    trim: true,
  },
  // Task submitter
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  // Mapping status
  mappingStatus: {
    type: String,
    enum: ['Mapped to You', 'Mapped to Another Staff', 'Unmapped'],
    required: true,
  },
  // Approval workflow
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Requested Edit'],
    default: 'Pending',
  },
  approvalChain: [{
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
    },
    approvedAt: Date,
    comments: String,
  }],
  // CBS Validation
  cbsValidated: {
    type: Boolean,
    default: false,
  },
  cbsValidatedAt: Date,
  cbsValidationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CBSValidation',
  },
  // Task date
  taskDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // Performance impact
  performanceImpacted: {
    type: Boolean,
    default: false,
  },
  performanceImpactedAt: Date,
}, {
  timestamps: true,
});

// Indexes
dailyTaskSchema.index({ submittedBy: 1, taskDate: 1 });
dailyTaskSchema.index({ branchId: 1, taskDate: 1 });
dailyTaskSchema.index({ approvalStatus: 1, branchId: 1 });
dailyTaskSchema.index({ cbsValidated: 1, taskDate: 1 });

export default mongoose.model('DailyTask', dailyTaskSchema);

