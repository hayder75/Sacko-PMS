import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { normalizeRole } from '../utils/roleNormalizer.js';
import { hashPassword, POSITION_TO_ENUM, POSITION_MAP } from '../utils/prismaHelpers.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private
export const getUsers = asyncHandler(async (req, res) => {
  const { role, branchId, branch_code, sub_team, isActive } = req.query;

  const where = {};

  // Role-based filtering (normalize roles to handle both old and new formats)
  const userRole = normalizeRole(req.user.role);

  if (userRole === 'admin') {
    // Admin can see all
  } else if (userRole === 'branchManager') {
    // Branch Manager sees users in their branch
    if (req.user.branchId) {
      where.branchId = req.user.branchId;
    } else if (req.user.branch_code) {
      where.branch_code = req.user.branch_code;
    }
  } else if (userRole === 'lineManager') {
    // Line Manager sees users in their sub-team
    if (req.user.branchId) {
      where.branchId = req.user.branchId;
    } else if (req.user.branch_code) {
      where.branch_code = req.user.branch_code;
    }
    if (req.user.sub_team) {
      where.sub_team = req.user.sub_team;
    }
  } else {
    // Staff sees only themselves
    where.id = req.user.id;
  }

  if (role) {
    // Handle both single role and array of roles
    if (Array.isArray(role)) {
      where.role = { in: role };
    } else {
      where.role = role;
    }
  }
  if (branchId) where.branchId = branchId;
  if (branch_code) where.branch_code = branch_code;
  if (sub_team) where.sub_team = sub_team;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const users = await prisma.user.findMany({
    where,
    include: {
      branch: { select: { id: true, name: true, code: true } },
      region: { select: { id: true, name: true } },
      area: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Map for backward compatibility
  const mappedUsers = users.map(user => ({
    ...user,
    _id: user.id,
    branchId: user.branch ? { ...user.branch, _id: user.branch.id } : null,
    regionId: user.region ? { ...user.region, _id: user.region.id } : null,
    areaId: user.area ? { ...user.area, _id: user.area.id } : null,
    position: POSITION_MAP[user.position] || user.position,
  }));

  res.status(200).json({
    success: true,
    count: mappedUsers.length,
    data: mappedUsers,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      region: { select: { id: true, name: true } },
      area: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Map for backward compatibility
  const mappedUser = {
    ...user,
    _id: user.id,
    branchId: user.branch ? { ...user.branch, _id: user.branch.id } : null,
    regionId: user.region ? { ...user.region, _id: user.region.id } : null,
    areaId: user.area ? { ...user.area, _id: user.area.id } : null,
    position: POSITION_MAP[user.position] || user.position,
  };

  res.status(200).json({
    success: true,
    data: mappedUser,
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
  const normalizedTargetPosition = targetPosition;

  // Admin can create Regional Directors, Area Managers, and Branch Managers
  if (normalizedCreatorRole === 'admin' && ['Regional Director', 'Area Manager', 'Branch Manager'].includes(normalizedTargetPosition)) {
    return true;
  }

  // Regional Director can create Area Managers
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
  const creatorPosString = POSITION_MAP[creatorPosition] || creatorPosition;
  if (creatorPosString === 'Member Service Manager (MSM)' && ['Member Service Officer I', 'Member Service Officer II', 'Member Service Officer III'].includes(normalizedTargetPosition)) {
    return true;
  }

  // Accountant (Sub-Team Leader) can create MSOs
  if (creatorPosString === 'Accountant' && ['Member Service Officer I', 'Member Service Officer II', 'Member Service Officer III'].includes(normalizedTargetPosition)) {
    return true;
  }

  return false;
};

// @desc    Create user
// @route   POST /api/users
// @access  Private
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, position, branch_code, sub_team, employeeId, branchId, regionId, areaId } = req.body;

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

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Convert position to enum
  const positionEnum = POSITION_TO_ENUM[position] || position;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: targetRole,
      position: positionEnum,
      branch_code: branch_code || req.user.branch_code,
      sub_team: sub_team || req.user.sub_team,
      employeeId: employeeId || email.split('@')[0],
      branchId: branchId || req.user.branchId,
      regionId: regionId || null,
      areaId: areaId || null,
      isActive: true,
    },
  });

  await logAudit(
    req.user.id,
    'User Created',
    'User',
    user.id,
    user.name,
    `Created user: ${user.name} with position ${position}`,
    req
  );

  res.status(201).json({
    success: true,
    data: { ...user, _id: user.id, position: POSITION_MAP[user.position] || user.position },
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (HQ Admin)
export const updateUser = asyncHandler(async (req, res) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Prepare update data
  const updateData = { ...req.body };

  // Hash password if being updated
  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  // Convert position to enum if provided
  if (updateData.position) {
    updateData.position = POSITION_TO_ENUM[updateData.position] || updateData.position;
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
  });

  await logAudit(
    req.user.id,
    'User Updated',
    'User',
    user.id,
    user.name,
    `Updated user: ${user.name}`,
    req
  );

  res.status(200).json({
    success: true,
    data: { ...user, _id: user.id, position: POSITION_MAP[user.position] || user.position },
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (HQ Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Soft delete - set isActive to false
  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  await logAudit(
    req.user.id,
    'User Deleted',
    'User',
    user.id,
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
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: req.params.id },
    data: { password: hashedPassword },
  });

  await logAudit(
    req.user.id,
    'Password Reset',
    'User',
    user.id,
    user.name,
    `Password reset for user: ${user.name}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});
