import { asyncHandler } from '../middleware/asyncHandler.js';
import Branch from '../models/Branch.js';
import { logAudit } from '../utils/auditLogger.js';
import Area from '../models/Area.js';
import Region from '../models/Region.js';
import User from '../models/User.js';

// @desc    Get all branches
// @route   GET /api/branches
// @access  Private (Admin)
export const getBranches = asyncHandler(async (req, res) => {
  const { isActive, areaId, regionId } = req.query;
  
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (areaId) query.areaId = areaId;
  if (regionId) query.regionId = regionId;

  const branches = await Branch.find(query)
    .populate('regionId', 'name')
    .populate('areaId', 'name')
    .populate('managerId', 'name email')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: branches.length,
    data: branches,
  });
});

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Private (Admin)
export const getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id)
    .populate('regionId', 'name')
    .populate('areaId', 'name')
    .populate('managerId', 'name email');

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found',
    });
  }

  res.status(200).json({
    success: true,
    data: branch,
  });
});

// @desc    Create branch
// @route   POST /api/branches
// @access  Private (Admin only)
export const createBranch = asyncHandler(async (req, res) => {
  const { name, code, regionId, areaId, managerId, address, phone } = req.body;

  // Validate required fields
  if (!name || !code || !regionId || !areaId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, code, regionId, areaId',
    });
  }

  // Check if branch code already exists
  const existingBranch = await Branch.findOne({ code: code.toUpperCase().trim() });
  if (existingBranch) {
    return res.status(400).json({
      success: false,
      message: `Branch with code '${code}' already exists`,
    });
  }

  // Verify region exists
  const region = await Region.findById(regionId);
  if (!region) {
    return res.status(400).json({
      success: false,
      message: 'Invalid regionId',
    });
  }

  // Verify area exists and belongs to region
  const area = await Area.findById(areaId);
  if (!area) {
    return res.status(400).json({
      success: false,
      message: 'Invalid areaId',
    });
  }

  if (area.regionId.toString() !== regionId.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Area does not belong to the specified region',
    });
  }

  // Verify manager exists and is a Branch Manager (if provided)
  if (managerId) {
    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(400).json({
        success: false,
        message: 'Invalid managerId',
      });
    }
    
    const { normalizeRole } = await import('../utils/roleNormalizer.js');
    const managerRole = normalizeRole(manager.role);
    if (managerRole !== 'branchManager') {
      return res.status(400).json({
        success: false,
        message: 'Manager must have Branch Manager role',
      });
    }
  }

  // Create branch
  const branch = await Branch.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    regionId,
    areaId,
    managerId: managerId || null,
    address: address?.trim() || '',
    phone: phone?.trim() || '',
    isActive: true,
  });

  await logAudit(
    req.user._id,
    'Branch Created',
    'Branch',
    branch._id,
    branch.name,
    `Created branch: ${branch.name} (${branch.code})`,
    req
  );

  const populatedBranch = await Branch.findById(branch._id)
    .populate('regionId', 'name')
    .populate('areaId', 'name')
    .populate('managerId', 'name email');

  res.status(201).json({
    success: true,
    message: 'Branch created successfully',
    data: populatedBranch,
  });
});

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private (Admin only)
export const updateBranch = asyncHandler(async (req, res) => {
  const { name, code, regionId, areaId, managerId, address, phone, isActive } = req.body;

  const branch = await Branch.findById(req.params.id);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found',
    });
  }

  // If code is being changed, check for duplicates
  if (code && code.toUpperCase().trim() !== branch.code) {
    const existingBranch = await Branch.findOne({ code: code.toUpperCase().trim() });
    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: `Branch with code '${code}' already exists`,
      });
    }
  }

  // Verify region exists (if being updated)
  if (regionId) {
    const region = await Region.findById(regionId);
    if (!region) {
      return res.status(400).json({
        success: false,
        message: 'Invalid regionId',
      });
    }
  }

  // Verify area exists and belongs to region (if being updated)
  if (areaId) {
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(400).json({
        success: false,
        message: 'Invalid areaId',
      });
    }

    const finalRegionId = regionId || branch.regionId;
    if (area.regionId.toString() !== finalRegionId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Area does not belong to the specified region',
      });
    }
  }

  // Verify manager exists and is a Branch Manager (if being updated)
  if (managerId !== undefined) {
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Invalid managerId',
        });
      }
      
      const { normalizeRole } = await import('../utils/roleNormalizer.js');
      const managerRole = normalizeRole(manager.role);
      if (managerRole !== 'branchManager') {
        return res.status(400).json({
          success: false,
          message: 'Manager must have Branch Manager role',
        });
      }
    }
  }

  // Update branch (never hard delete - only deactivate)
  const updateData = {};
  if (name) updateData.name = name.trim();
  if (code) updateData.code = code.toUpperCase().trim();
  if (regionId) updateData.regionId = regionId;
  if (areaId) updateData.areaId = areaId;
  if (managerId !== undefined) updateData.managerId = managerId || null;
  if (address !== undefined) updateData.address = address?.trim() || '';
  if (phone !== undefined) updateData.phone = phone?.trim() || '';
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedBranch = await Branch.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('regionId', 'name')
    .populate('areaId', 'name')
    .populate('managerId', 'name email');

  await logAudit(
    req.user._id,
    'Branch Updated',
    'Branch',
    updatedBranch._id,
    updatedBranch.name,
    `Updated branch: ${updatedBranch.name} (${updatedBranch.code})`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Branch updated successfully',
    data: updatedBranch,
  });
});

// @desc    Deactivate branch (soft delete)
// @route   DELETE /api/branches/:id
// @access  Private (Admin only)
export const deleteBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found',
    });
  }

  // Check if branch has active users
  const activeUsers = await User.countDocuments({
    branchId: branch._id,
    isActive: true,
  });

  if (activeUsers > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot deactivate branch. ${activeUsers} active user(s) are assigned to this branch. Please reassign users first.`,
    });
  }

  // Soft delete - set isActive to false (never hard delete to preserve historical data)
  branch.isActive = false;
  await branch.save();

  await logAudit(
    req.user._id,
    'Branch Deactivated',
    'Branch',
    branch._id,
    branch.name,
    `Deactivated branch: ${branch.name} (${branch.code})`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Branch deactivated successfully',
    data: branch,
  });
});

