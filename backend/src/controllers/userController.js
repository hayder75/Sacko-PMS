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
  } else if (userRole === 'regionalDirector') {
    // Regional Director sees users in their region
    if (req.user.regionId) {
      where.regionId = req.user.regionId;
    }
  } else if (userRole === 'areaManager') {
    // Area Manager sees users in their area
    if (req.user.areaId) {
      where.areaId = req.user.areaId;
    } else if (req.user.regionId) {
      where.regionId = req.user.regionId;
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


// @desc    Get org hierarchy tree
// @route   GET /api/users/hierarchy
// @access  Private
export const getHierarchy = asyncHandler(async (req, res) => {
  const userRole = normalizeRole(req.user.role);
  let result = {};

  if (userRole === 'admin') {
    const regions = await prisma.region.findMany({
      where: { isActive: true },
      include: {
        director: { select: { id: true, name: true, email: true, role: true, position: true } },
        areas: {
          where: { isActive: true },
          include: {
            manager: { select: { id: true, name: true, email: true, role: true, position: true } },
            branches: {
              where: { isActive: true },
              include: {
                manager: { select: { id: true, name: true, email: true, role: true, position: true } },
                users: {
                  where: { isActive: true },
                  select: { id: true, name: true, email: true, role: true, position: true, employeeId: true, sub_team: true }
                }
              },
              orderBy: { name: 'asc' }
            }
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    result = { regions };
  } else if (userRole === 'regionalDirector') {
    const regions = await prisma.region.findMany({
      where: { id: req.user.regionId, isActive: true },
      include: {
        director: { select: { id: true, name: true, email: true, role: true, position: true } },
        areas: {
          where: { isActive: true },
          include: {
            manager: { select: { id: true, name: true, email: true, role: true, position: true } },
            branches: {
              where: { isActive: true },
              include: {
                manager: { select: { id: true, name: true, email: true, role: true, position: true } },
                users: {
                  where: { isActive: true },
                  select: { id: true, name: true, email: true, role: true, position: true, employeeId: true, sub_team: true }
                }
              },
              orderBy: { name: 'asc' }
            }
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    result = { regions };
  } else if (userRole === 'areaManager') {
    const areas = await prisma.area.findMany({
      where: { id: req.user.areaId, isActive: true },
      include: {
        manager: { select: { id: true, name: true, email: true, role: true, position: true } },
        region: { select: { id: true, name: true, director: { select: { id: true, name: true } } } },
        branches: {
          where: { isActive: true },
          include: {
            manager: { select: { id: true, name: true, email: true, role: true, position: true } },
            users: {
              where: { isActive: true },
              select: { id: true, name: true, email: true, role: true, position: true, employeeId: true, sub_team: true }
            }
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    result = { areas };
  } else if (userRole === 'branchManager' || userRole === 'lineManager') {
    const branches = await prisma.branch.findMany({
      where: { id: req.user.branchId, isActive: true },
      include: {
        manager: { select: { id: true, name: true, email: true, role: true, position: true } },
        area: { select: { id: true, name: true, region: { select: { id: true, name: true } } } },
        users: {
          where: { isActive: true },
          select: { id: true, name: true, email: true, role: true, position: true, employeeId: true, sub_team: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    result = { branches };
  } else {
    result = { self: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } };
  }

  res.status(200).json({ success: true, data: result });
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

  // Auto-populate regionId/areaId/branch_code from branch if not provided
  let resolvedRegionId = regionId || null;
  let resolvedAreaId = areaId || null;
  let resolvedBranchCode = branch_code || null;
  const resolvedBranchId = branchId || req.user.branchId;
  if (resolvedBranchId) {
    try {
      const branch = await prisma.branch.findUnique({
        where: { id: resolvedBranchId },
        select: { regionId: true, areaId: true, code: true }
      });
      if (branch) {
        if (!resolvedRegionId) resolvedRegionId = branch.regionId;
        if (!resolvedAreaId) resolvedAreaId = branch.areaId;
        if (!resolvedBranchCode) resolvedBranchCode = branch.code;
      }
    } catch (e) {
      console.error('Failed to resolve branch region/area:', e.message);
    }
  }

  // Only require branch_code for branch-level roles
  const branchRoles = ['branchManager', 'lineManager', 'subTeamLeader', 'staff'];
  if (branchRoles.includes(targetRole) && !resolvedBranchCode) {
    return res.status(400).json({
      success: false,
      message: 'branch_code is required for branch-level users',
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
      branch_code: resolvedBranchCode || req.user.branch_code,
      sub_team: sub_team || req.user.sub_team,
      employeeId: employeeId || email.split('@')[0],
      branchId: resolvedBranchId,
      regionId: resolvedRegionId,
      areaId: resolvedAreaId,
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

  // Update parent entity directorId/managerId for management roles
  if (targetRole === 'regionalDirector' && resolvedRegionId) {
    await prisma.region.update({
      where: { id: resolvedRegionId },
      data: { directorId: user.id }
    }).catch(e => console.error('Failed to update region director:', e.message));
  } else if (targetRole === 'areaManager' && resolvedAreaId) {
    await prisma.area.update({
      where: { id: resolvedAreaId },
      data: { managerId: user.id }
    }).catch(e => console.error('Failed to update area manager:', e.message));
  } else if (targetRole === 'branchManager' && resolvedBranchId) {
    await prisma.branch.update({
      where: { id: resolvedBranchId },
      data: { managerId: user.id }
    }).catch(e => console.error('Failed to update branch manager:', e.message));
  }

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

// @desc    Get public user list for login page
// @route   GET /api/users/public-list
// @access  Public
export const getPublicUserList = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      role: true,
      branch_code: true,
      sub_team: true,
      branch: { select: { name: true } },
      area: { select: { name: true } },
      region: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

  const data = users.map(u => {
    const location = u.branch?.name || u.area?.name || u.region?.name || u.branch_code || '';
    return {
      _id: u.id,
      id: u.id,
      name: u.name,
      email: u.email,
      position: u.position,
      role: u.role,
      location,
    };
  });

  res.status(200).json({ success: true, data });
});
