import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'Plan Upload',
      'Plan Update',
      'User Created',
      'User Updated',
      'User Deleted',
      'Mapping Updated',
      'Mapping Created',
      'Task Created',
      'Task Approved',
      'Task Rejected',
      'Approval',
      'KPI Framework Updated',
      'Competency Framework Updated',
      'CBS Upload',
      'CBS Validation',
      'Behavioral Evaluation',
      'Password Reset',
      'Login',
      'Logout',
    ],
  },
  entityType: {
    type: String,
    enum: ['Plan', 'User', 'Mapping', 'Task', 'CBS', 'Evaluation', 'Framework', 'System'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  entityName: {
    type: String,
  },
  details: {
    type: String,
    trim: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);

