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

    const userRole = normalizeRole(req.user.role);
    if (!roles.includes(userRole)) {
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

  const userRole = normalizeRole(req.user.role);
  if (userRole === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: `User role '${req.user.role}' is not authorized to access this route`,
  });
};

export const isHQAdmin = isAdmin;

export const isRegionalDirector = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const userRole = normalizeRole(req.user.role);
  if (userRole === 'regionalDirector' || userRole === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden' });
};

export const isAreaManager = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const userRole = normalizeRole(req.user.role);
  if (userRole === 'areaManager' || userRole === 'admin' || userRole === 'regionalDirector') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden' });
};

export const isBranchManager = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const userRole = normalizeRole(req.user.role);
  if (userRole === 'branchManager' || userRole === 'admin' || userRole === 'lineManager' || userRole === 'regionalDirector' || userRole === 'areaManager') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden' });
};

export const isLineManager = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const userRole = normalizeRole(req.user.role);
  if (userRole === 'lineManager' || userRole === 'admin' || userRole === 'branchManager') {
    return next();
  }
  return next();
};

export const isSubTeamLeader = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const userRole = normalizeRole(req.user.role);
  if (userRole === 'subTeamLeader' || userRole === 'admin' || userRole === 'branchManager') {
    return next();
  }
  return next();
};

export const isStaff = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  return next();
};

// Combined role checkers
export const isManagerOrAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const userRole = normalizeRole(req.user.role);
  const managerRoles = ['admin', 'regionalDirector', 'areaManager', 'branchManager', 'lineManager'];

  if (managerRoles.includes(userRole)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: `User role '${req.user.role}' is not authorized to access this route`,
  });
};

export const canApprove = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
  const userRole = normalizeRole(req.user.role);
  const approverRoles = ['admin', 'areaManager', 'branchManager', 'lineManager', 'subTeamLeader'];

  if (approverRoles.includes(userRole)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden' });
};

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
