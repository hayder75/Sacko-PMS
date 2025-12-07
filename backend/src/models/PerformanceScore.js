import mongoose from 'mongoose';

const performanceScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  // Period
  period: {
    type: String,
    required: true,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'],
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
  week: {
    type: Number,
    min: 1,
    max: 52,
  },
  day: {
    type: Number,
    min: 1,
    max: 31,
  },
  // KPI Scores (85% weight)
  kpiScores: {
    deposit: {
      target: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      weight: { type: Number, default: 25 },
      score: { type: Number, default: 0 },
    },
    digital: {
      target: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      weight: { type: Number, default: 20 },
      score: { type: Number, default: 0 },
    },
    loan: {
      target: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      weight: { type: Number, default: 20 },
      score: { type: Number, default: 0 },
    },
    customerBase: {
      target: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      weight: { type: Number, default: 15 },
      score: { type: Number, default: 0 },
    },
    memberRegistration: {
      target: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      weight: { type: Number, default: 10 },
      score: { type: Number, default: 0 },
    },
  },
  // Total KPI Score (85% weight)
  kpiTotalScore: {
    type: Number,
    default: 0,
  },
  // Behavioral Score (15% weight)
  behavioralScore: {
    type: Number,
    default: 0,
  },
  behavioralEvaluationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BehavioralEvaluation',
  },
  // Final Score
  finalScore: {
    type: Number,
    default: 0,
  },
  // Rating
  rating: {
    type: String,
    enum: ['Outstanding', 'Very Good', 'Good', 'Needs Support', 'Unsatisfactory'],
  },
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Calculated', 'Locked', 'Finalized'],
    default: 'Draft',
  },
  // Locked after CBS validation
  isLocked: {
    type: Boolean,
    default: false,
  },
  lockedAt: Date,
}, {
  timestamps: true,
});

// Indexes
performanceScoreSchema.index({ userId: 1, period: 1, year: 1, month: 1 });
performanceScoreSchema.index({ branchId: 1, period: 1, year: 1 });

export default mongoose.model('PerformanceScore', performanceScoreSchema);

