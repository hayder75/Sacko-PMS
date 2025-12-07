import mongoose from 'mongoose';

const behavioralEvaluationSchema = new mongoose.Schema({
  evaluatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  // Evaluation period
  period: {
    type: String,
    required: true,
    enum: ['Monthly', 'Quarterly', 'Annual'],
  },
  year: {
    type: Number,
    required: true,
  },
  quarter: {
    type: Number,
    min: 1,
    max: 4,
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
  },
  // Competency scores (1-5 scale)
  competencies: {
    communication: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 15 },
      comments: String,
    },
    teamwork: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 12 },
      comments: String,
    },
    problemSolving: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 15 },
      comments: String,
    },
    adaptability: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 10 },
      comments: String,
    },
    leadership: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 15 },
      comments: String,
    },
    customerFocus: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 18 },
      comments: String,
    },
    initiative: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 10 },
      comments: String,
    },
    reliability: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 5 },
      comments: String,
    },
  },
  // Total behavioral score (out of 15%)
  totalScore: {
    type: Number,
    default: 0,
  },
  // Overall comments
  overallComments: {
    type: String,
    trim: true,
  },
  // Approval workflow
  approvalStatus: {
    type: String,
    enum: ['Draft', 'Pending', 'Approved', 'Rejected'],
    default: 'Draft',
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
  // Status
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockedAt: Date,
}, {
  timestamps: true,
});

// Indexes
behavioralEvaluationSchema.index({ evaluatedUserId: 1, period: 1, year: 1, month: 1 });
behavioralEvaluationSchema.index({ branchId: 1, approvalStatus: 1 });

export default mongoose.model('BehavioralEvaluation', behavioralEvaluationSchema);

