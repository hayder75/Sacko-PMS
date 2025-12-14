import { asyncHandler } from '../middleware/asyncHandler.js';
import Region from '../models/Region.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all regions
// @route   GET /api/regions
// @access  Private (Admin)
export const getRegions = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const regions = await Region.find(query)
    .populate('directorId', 'name email')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: regions.length,
    data: regions,
  });
});

// @desc    Get single region
// @route   GET /api/regions/:id
// @access  Private (Admin)
export const getRegion = asyncHandler(async (req, res) => {
  const region = await Region.findById(req.params.id).populate('directorId', 'name email');

  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found',
    });
  }

  res.status(200).json({
    success: true,
    data: region,
  });
});

// @desc    Create region
// @route   POST /api/regions
// @access  Private (Admin)
export const createRegion = asyncHandler(async (req, res) => {
  const { name, code, directorId } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      message: 'Please enter all required fields: name, code',
    });
  }

  const existingRegion = await Region.findOne({ code });
  if (existingRegion) {
    return res.status(400).json({
      success: false,
      message: `Region with code '${code}' already exists`,
    });
  }

  const region = await Region.create({
    name,
    code,
    directorId: directorId || undefined,
  });

  await logAudit(
    req.user._id,
    'Region Created',
    'Region',
    region._id,
    region.name,
    `Created region: ${region.name} (${region.code})`,
    req
  );

  res.status(201).json({
    success: true,
    message: 'Region created successfully',
    data: region,
  });
});

// @desc    Update region
// @route   PUT /api/regions/:id
// @access  Private (Admin)
export const updateRegion = asyncHandler(async (req, res) => {
  let region = await Region.findById(req.params.id);

  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found',
    });
  }

  region = await Region.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(
    req.user._id,
    'Region Updated',
    'Region',
    region._id,
    region.name,
    `Updated region: ${region.name}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Region updated successfully',
    data: region,
  });
});

// @desc    Delete region (soft delete)
// @route   DELETE /api/regions/:id
// @access  Private (Admin)
export const deleteRegion = asyncHandler(async (req, res) => {
  const region = await Region.findById(req.params.id);

  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found',
    });
  }

  // Soft delete - set isActive to false
  region.isActive = false;
  await region.save();

  await logAudit(
    req.user._id,
    'Region Deleted',
    'Region',
    region._id,
    region.name,
    `Deactivated region: ${region.name}`,
    req
  );

  res.status(200).json({
    success: true,
    message: 'Region deactivated successfully',
    data: region,
  });
});

