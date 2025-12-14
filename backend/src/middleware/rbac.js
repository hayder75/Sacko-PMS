import { normalizeRole } from '../utils/roleNormalizer.js';
// Role-Based Access Control Middleware

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

// Specific role checkers
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  // Check for both 'admin' and 'SAKO HQ / Admin' roles
  if (req.user.role === 'admin' || req.user.role === 'SAKO HQ / Admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `User role '${req.user.role}' is not authorized to access this route`,
  });
};
export const isHQAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  // Check for both 'admin' and 'SAKO HQ / Admin' roles
  if (req.user.role === 'admin' || req.user.role === 'SAKO HQ / Admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `User role '${req.user.role}' is not authorized to access this route`,
  });
};
export const isRegionalDirector = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (req.user.role === 'regionalDirector' || req.user.role === 'Regional Director' || req.user.role === 'Regional Manager') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `User role '${req.user.role}' is not authorized to access this route`,
  });
};

export const isAreaManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (req.user.role === 'areaManager' || req.user.role === 'Area Manager') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `User role '${req.user.role}' is not authorized to access this route`,
  });
};

export const isBranchManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  // Allow Branch Managers and Line Managers (MSM) to access branch-level routes
  if (
    req.user.role === 'branchManager' ||
    req.user.role === 'Branch Manager' ||
    req.user.role === 'lineManager' ||
    req.user.role === 'Line Manager' ||
    req.user.role === 'Member Service Manager (MSM)' ||
    req.user.role === 'MSM'
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `User role '${req.user.role}' is not authorized to access this route`,
  });
};

export const isLineManager = authorize('lineManager');
export const isSubTeamLeader = authorize('subTeamLeader');
export const isStaff = authorize('staff');

// Combined role checkers
export const isManagerOrAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }
  
  const normalized = normalizeRole(req.user.role);

  // Check for both old and new role formats (includes lineManager/MSM)
  const allowedRoles = [
    'admin', 'SAKO HQ / Admin',
    'regionalDirector', 'Regional Director', 'Regional Manager',
    'areaManager', 'Area Manager',
    'branchManager', 'Branch Manager',
    'lineManager', 'Line Manager', 'Member Service Manager (MSM)', 'MSM',
  ];

  if (allowedRoles.includes(req.user.role) || allowedRoles.includes(normalized)) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: `User role '${req.user.role}' is not authorized to access this route`,
  });
};

export const canApprove = authorize(
  'admin',
  'areaManager',
  'branchManager',
  'lineManager',
  'subTeamLeader'
);

// Position-based checkers
export const canApproveByPosition = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const approverPositions = ['Branch Manager', 'Member Service Manager (MSM)', 'Accountant'];
  if (!approverPositions.includes(req.user.position)) {
    return res.status(403).json({
      success: false,
      message: `Your position '${req.user.position}' cannot approve tasks`,
    });
  }

  next();
};

