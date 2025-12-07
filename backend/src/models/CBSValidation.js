import mongoose from 'mongoose';

const cbsValidationSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  validationDate: {
    type: Date,
    required: true,
  },
  // File upload info
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Validation results
  totalRecords: {
    type: Number,
    default: 0,
  },
  matchedRecords: {
    type: Number,
    default: 0,
  },
  unmatchedRecords: {
    type: Number,
    default: 0,
  },
  discrepancyCount: {
    type: Number,
    default: 0,
  },
  // Validation status
  status: {
    type: String,
    enum: ['Processing', 'Completed', 'Failed', 'Partial'],
    default: 'Processing',
  },
  // Discrepancies
  discrepancies: [{
    accountNumber: String,
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyTask',
    },
    cbsAmount: Number,
    pmsAmount: Number,
    difference: Number,
    type: {
      type: String,
      enum: ['Amount Mismatch', 'Missing in CBS', 'Missing in PMS', 'Account Mismatch'],
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    resolutionNotes: String,
  }],
  // Validation completion
  validatedAt: Date,
  validationRate: {
    type: Number,
    default: 0,
  },
  // Unmapped products found in CBS
  unmappedProducts: [{
    productName: {
      type: String,
      required: true,
    },
    accountCount: {
      type: Number,
      default: 0,
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes
cbsValidationSchema.index({ branchId: 1, validationDate: 1 });
cbsValidationSchema.index({ status: 1 });

export default mongoose.model('CBSValidation', cbsValidationSchema);

