import prisma from '../config/database.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { hashPassword, comparePassword, POSITION_TO_ENUM } from '../utils/prismaHelpers.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Private (HQ Admin only)
export const register = asyncHandler(async (req, res) => {
  const { employeeId, name, email, password, role, branchId, position, branch_code, regionId, areaId, sub_team } = req.body;

  // Hash password before saving
  const hashedPassword = await hashPassword(password);

  // Convert position to enum if needed
  const positionEnum = POSITION_TO_ENUM[position] || position;

  const user = await prisma.user.create({
    data: {
      employeeId,
      name,
      email,
      password: hashedPassword,
      role,
      branchId: branchId || null,
      branch_code: branch_code || null,
      regionId: regionId || null,
      areaId: areaId || null,
      sub_team: sub_team || null,
      position: positionEnum,
    },
  });

  await logAudit(
    req.user.id,
    'User Created',
    'User',
    user.id,
    user.name,
    `Created user: ${user.name} with role ${user.role}`,
    req
  );

  res.status(201).json({
    success: true,
    data: {
      _id: user.id,
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is inactive',
    });
  }

  const token = generateToken(user.id);

  await logAudit(
    user.id,
    'Login',
    'System',
    null,
    'Login',
    `User logged in`,
    req
  );

  res.status(200).json({
    success: true,
    token,
    data: {
      _id: user.id,
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      branch: {
        select: { id: true, name: true, code: true },
      },
      region: {
        select: { id: true, name: true },
      },
      area: {
        select: { id: true, name: true },
      },
    },
  });

  // Add _id alias for backward compatibility
  const userData = { ...user, _id: user.id };
  if (userData.branch) {
    userData.branch._id = userData.branch.id;
    userData.branchId = userData.branch;
  }
  if (userData.region) {
    userData.region._id = userData.region.id;
    userData.regionId = userData.region;
  }
  if (userData.area) {
    userData.area._id = userData.area.id;
    userData.areaId = userData.area;
  }

  res.status(200).json({
    success: true,
    data: userData,
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {};
  if (req.body.name) fieldsToUpdate.name = req.body.name;
  if (req.body.email) fieldsToUpdate.email = req.body.email;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: fieldsToUpdate,
  });

  await logAudit(
    req.user.id,
    'User Updated',
    'User',
    user.id,
    user.name,
    `Updated user details`,
    req
  );

  res.status(200).json({
    success: true,
    data: { ...user, _id: user.id },
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!(await comparePassword(req.body.currentPassword, user.password))) {
    return res.status(401).json({
      success: false,
      message: 'Password is incorrect',
    });
  }

  const hashedPassword = await hashPassword(req.body.newPassword);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  await logAudit(
    req.user.id,
    'Password Reset',
    'User',
    user.id,
    user.name,
    `Password updated`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});
