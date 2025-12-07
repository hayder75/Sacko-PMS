import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { isHQAdmin } from '../middleware/rbac.js';

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private (HQ Admin only)
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, entityType, userId, startDate, endDate, limit = 100 } = req.query;
  
  const query = {};
  
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  if (userId) query.userId = userId;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const auditLogs = await AuditLog.find(query)
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    data: auditLogs.map(log => ({
      _id: log._id,
      id: log._id,
      timestamp: log.createdAt,
      createdAt: log.createdAt,
      user: log.userId?.name || 'Unknown',
      userName: log.userId?.name || 'Unknown',
      action: log.action,
      entity: log.entityName || log.entityType || 'N/A',
      entityName: log.entityName || log.entityType || 'N/A',
      details: log.details || `${log.action} on ${log.entityName || log.entityType || 'entity'}`,
      description: log.details || `${log.action} on ${log.entityName || log.entityType || 'entity'}`,
      entityType: log.entityType,
      ipAddress: log.ipAddress,
    })),
  });
});

// @desc    Get single audit log
// @route   GET /api/audit/:id
// @access  Private (HQ Admin only)
export const getAuditLog = asyncHandler(async (req, res) => {
  const auditLog = await AuditLog.findById(req.params.id)
    .populate('userId', 'name email role');

  if (!auditLog) {
    return res.status(404).json({
      success: false,
      message: 'Audit log not found',
    });
  }

  res.status(200).json({
    success: true,
    data: auditLog,
  });
});

