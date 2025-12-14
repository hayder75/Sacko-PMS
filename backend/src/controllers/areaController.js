import { asyncHandler } from '../middleware/asyncHandler.js';
import Area from '../models/Area.js';
import Region from '../models/Region.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all areas
// @route   GET /api/areas
// @access  Private (Admin)
export const getAreas = asyncHandler(async (req, res) => {
  const { isActive, regionId } = req.query;
  
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (regionId) query.regionId = regionId;

  const areas = await Area.find(query)
    .populate('regionId', 'name code')
    .populate('managerId', 'name email')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: areas.length,
    data: areas,
  });
});

// @desc    Get single area
// @route   GET /api/areas/:id
// @access  Private (Admin)
export const getArea = asyncHandler(async (req, res) => {
  const area = await Area.findById(req.params.id)
    .populate('regionId', 'name code')
    .populate('managerId', 'name email');

  if (!area) {
    return res.status(404).json({
      success: false,
      message: 'Area not found',
    });
  }

  res.status(200).json({
    success: true,
    data: area,
  });
});

// @desc    Create area
// @route   POST /api/areas
// @access  Private (Admin)
export const createArea = asyncHandler(async (req, res) => {
  const { name, code, regionId, managerId } = req.body;

  if (!name || !code || !regionId) {
    return res.status(400).json({
      success: false,
      message: 'Please enter all required fields: name, code, regionId',
    });
  }

  const existingArea = await Area.findOne({ code });
  if (existingArea) {
    return res.status(400).json({
      success: false,
      message: `Area with code '${code}' already exists`,
    });
  }

  const region = await Region.findById(regionId);
  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found',
    });
  }

  const area = await Area.create({
    name,
    code,
    regionId,
    managerId: managerId || undefined,
  });

  await logAudit(
    req.user._id,
    'Area Created',
    'Area',
    area._id,
    area.name,
    `Created area: ${area.name} (${area.code}) in region ${region.name}`,
    req
  );

  res.status(201).json({
    success: true,
    message: 'Area created successfully',
    data: area,
  });
});

// @desc    Update area
// @route   PUT /api/areas/:id
// @access  Private (Admin)
export const updateArea = asyncHandler(async (req, res) => {
  let area = await Area.findById(req.params.id);

  if (!area) {
    return res.status(404).json({
      success: false,
      message: 'Area not found',
    });
  }

  area = await Area.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(
    req.user._id,
    'Area Updated',
    'Area',
    area._id,
    area.name,
    `Updated area: ${area.name}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Area updated successfully',
    data: area,
  });
});

// @desc    Delete area (soft delete)
// @route   DELETE /api/areas/:id
// @access  Private (Admin)
export const deleteArea = asyncHandler(async (req, res) => {
  const area = await Area.findById(req.params.id);

  if (!area) {
    return res.status(404).json({
      success: false,
      message: 'Area not found',
    });
  }

  // Soft delete - set isActive to false
  area.isActive = false;
  await area.save();

  await logAudit(
    req.user._id,
    'Area Deleted',
    'Area',
    area._id,
    area.name,
    `Deactivated area: ${area.name}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Area deactivated successfully',
    data: area,
  });
});

