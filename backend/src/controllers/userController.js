import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { normalizeRole } from '../utils/roleNormalizer.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getUsers = asyncHandler(async (req, res) => {
  const { role, branchId, branch_code, sub_team, isActive } = req.query;
  
  const query = {};
  
  // Role-based filtering (normalize roles to handle both old and new formats)
  const userRole = normalizeRole(req.user.role);
  
  if (userRole === 'admin') {
    // Admin can see all
  } else if (userRole === 'branchManager') {
    // Branch Manager sees users in their branch
    query.branch_code = req.user.branch_code;
  } else if (userRole === 'lineManager') {
    // Line Manager sees users in their sub-team
    query.branch_code = req.user.branch_code;
    query.sub_team = req.user.sub_team;
  } else {
    // Staff sees only themselves
    query._id = req.user._id;
  }
  
  if (role) query.role = role;
  if (branchId) query.branchId = branchId;
  if (branch_code) query.branch_code = branch_code;
  if (sub_team) query.sub_team = sub_team;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const users = await User.find(query)
    .populate('branchId', 'name code')
    .populate('regionId', 'name')
    .populate('areaId', 'name')
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('branchId', 'name code')
    .populate('regionId', 'name')
    .populate('areaId', 'name')
    .select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Helper function to check if creator can create user with given role
const canCreateRole = (creatorRole, targetRole) => {
  const roleHierarchy = {
    'admin': ['regionalDirector', 'areaManager', 'branchManager', 'lineManager', 'subTeamLeader', 'staff'],
    'regionalDirector': ['areaManager'],
    'areaManager': ['branchManager'],
    'branchManager': ['lineManager', 'subTeamLeader', 'staff'],
    'lineManager': ['staff'],
    'subTeamLeader': [],
    'staff': [],
  };

  return roleHierarchy[creatorRole]?.includes(targetRole) || false;
};

// Helper function to determine who can create which positions
const canCreatePosition = (creatorRole, creatorPosition, targetPosition) => {
  const normalizedCreatorRole = normalizeRole(creatorRole);
  const normalizedCreatorPosition = creatorPosition;
  const normalizedTargetPosition = targetPosition;

  // Admin can create Branch Managers
  if (normalizedCreatorRole === 'admin' && normalizedTargetPosition === 'Branch Manager') {
    return true;
  }
  
  // Regional Director can create Area Managers (position not in enum, handled separately)
  if (normalizedCreatorRole === 'regionalDirector' && normalizedTargetPosition === 'Area Manager') {
    return true;
  }
  
  // Area Manager can create Branch Managers
  if (normalizedCreatorRole === 'areaManager' && normalizedTargetPosition === 'Branch Manager') {
    return true;
  }
  
  // Branch Manager can create MSM, Accountant, and MSOs
  if (normalizedCreatorRole === 'branchManager' && ['Member Service Manager (MSM)', 'Accountant', 'Member Service Officer I', 'Member Service Officer II', 'Member Service Officer III'].includes(normalizedTargetPosition)) {
    return true;
  }
  
  // Line Manager (MSM) can create MSOs
  if (normalizedCreatorPosition === 'Member Service Manager (MSM)' && ['Member Service Officer I', 'Member Service Officer II', 'Member Service Officer III'].includes(normalizedTargetPosition)) {
    return true;
  }
  
  // Accountant (Sub-Team Leader) can create MSOs
  if (normalizedCreatorPosition === 'Accountant' && ['Member Service Officer I', 'Member Service Officer II', 'Member Service Officer III'].includes(normalizedTargetPosition)) {
    return true;
  }
  
  return false;
};

// @desc    Create user
// @route   POST /api/users
// @access  Private
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, position, branch_code, sub_team, employeeId } = req.body;

  // Validate required fields
  if (!position || position.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Position is required',
    });
  }

  if (!role) {
    return res.status(400).json({
      success: false,
      message: 'Role is required',
    });
  }

  // Check hierarchical creation rules
  // Normalize roles to handle both old and new formats
  const creatorRole = normalizeRole(req.user.role);
  const creatorPosition = req.user.position;
  const targetRole = normalizeRole(role);

  // Check if creator can create this role
  if (!canCreateRole(creatorRole, targetRole)) {
    return res.status(403).json({
      success: false,
      message: `You cannot create a user with role '${role}'. Your role '${req.user.role}' does not have permission.`,
    });
  }

  // Check if creator can create this position
  if (!canCreatePosition(creatorRole, creatorPosition, position)) {
    return res.status(403).json({
      success: false,
      message: `You cannot create a user with position '${position}'. Your role/position does not have permission.`,
    });
  }

  // Admin creates Branch Managers (no branch_code/sub_team needed yet)
  // Branch Manager creates MSMs/Accountants (need branch_code)
  // Line Manager creates MSOs (need branch_code and sub_team)
  if (role !== 'admin' && !branch_code) {
    return res.status(400).json({
      success: false,
      message: 'branch_code is required for non-admin users',
    });
  }

  if (['Member Service Officer I', 'Member Service Officer II', 'Member Service Officer III'].includes(position) && !sub_team) {
    return res.status(400).json({
      success: false,
      message: 'sub_team is required for MSO positions',
    });
  }

  // Create user (use normalized role)
  const userData = {
    name,
    email,
    password,
    role: targetRole, // Use normalized role
    position,
    branch_code: branch_code || req.user.branch_code,
    sub_team: sub_team || req.user.sub_team,
    employeeId: employeeId || email.split('@')[0],
    branchId: req.user.branchId,
    isActive: true,
  };

  const user = await User.create(userData);

  await logAudit(
    req.user._id,
    'User Created',
    'User',
    user._id,
    user.name,
    `Created user: ${user.name} with position ${position}`,
    req
  );

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (HQ Admin)
export const updateUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(
    req.user._id,
    'User Updated',
    'User',
    user._id,
    user.name,
    `Updated user: ${user.name}`,
    req
  );

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (HQ Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Soft delete - set isActive to false
  user.isActive = false;
  await user.save();

  await logAudit(
    req.user._id,
    'User Deleted',
    'User',
    user._id,
    user.name,
    `Deactivated user: ${user.name}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
  });
});

// @desc    Reset password
// @route   PUT /api/users/:id/reset-password
// @access  Private (HQ Admin)
export const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.password = newPassword;
  await user.save();

  await logAudit(
    req.user._id,
    'Password Reset',
    'User',
    user._id,
    user.name,
    `Password reset for user: ${user.name}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});

