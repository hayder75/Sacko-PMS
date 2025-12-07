import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Private (HQ Admin only)
export const register = asyncHandler(async (req, res) => {
  const { employeeId, name, email, password, role, branchId, position } = req.body;

  const user = await User.create({
    employeeId,
    name,
    email,
    password,
    role,
    branchId,
    position,
  });

  await logAudit(
    req.user._id,
    'User Created',
    'User',
    user._id,
    user.name,
    `Created user: ${user.name} with role ${user.role}`,
    req
  );

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
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

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
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

  const token = generateToken(user._id);

  await logAudit(
    user._id,
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
      _id: user._id,
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
  const user = await User.findById(req.user._id)
    .populate('branchId', 'name code')
    .populate('regionId', 'name')
    .populate('areaId', 'name');

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  await logAudit(
    req.user._id,
    'User Updated',
    'User',
    user._id,
    user.name,
    `Updated user details`,
    req
  );

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Password is incorrect',
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  await logAudit(
    req.user._id,
    'Password Reset',
    'User',
    user._id,
    user.name,
    `Password updated`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

