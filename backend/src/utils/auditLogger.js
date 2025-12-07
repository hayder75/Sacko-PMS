import AuditLog from '../models/AuditLog.js';

export const logAudit = async (userId, action, entityType, entityId, entityName, details, req = null) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      entityName,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent'),
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

