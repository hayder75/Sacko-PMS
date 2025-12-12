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
export const isAdmin = authorize('admin');
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
  if (req.user.role === 'branchManager' || req.user.role === 'Branch Manager') {
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
  
  // Check for both old and new role formats
  const allowedRoles = ['admin', 'SAKO HQ / Admin', 'regionalDirector', 'Regional Director', 'Regional Manager', 'areaManager', 'Area Manager', 'branchManager', 'Branch Manager'];
  if (allowedRoles.includes(req.user.role)) {
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

