import { asyncHandler } from '../middleware/asyncHandler.js';
import prisma from '../config/database.js';

// @desc    Get all regions
// @route   GET /api/regions
// @access  Private (Admin)
export const getRegions = asyncHandler(async (req, res) => {
  const { isActive } = req.query;

  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const regions = await prisma.region.findMany({
    where,
    include: {
      director: { select: { id: true, name: true, email: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Map for backward compatibility
  const mappedRegions = regions.map(region => ({
    ...region,
    _id: region.id,
    directorId: region.director ? { ...region.director, _id: region.director.id } : null,
  }));

  res.status(200).json({
    success: true,
    count: mappedRegions.length,
    data: mappedRegions,
  });
});

// @desc    Get single region
// @route   GET /api/regions/:id
// @access  Private (Admin)
export const getRegion = asyncHandler(async (req, res) => {
  const region = await prisma.region.findUnique({
    where: { id: req.params.id },
    include: {
      director: { select: { id: true, name: true, email: true } },
    },
  });

  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found',
    });
  }

  res.status(200).json({
    success: true,
    data: { ...region, _id: region.id },
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

  const existingRegion = await prisma.region.findUnique({ where: { code } });
  if (existingRegion) {
    return res.status(400).json({
      success: false,
      message: `Region with code '${code}' already exists`,
    });
  }

  const region = await prisma.region.create({
    data: {
      name,
      code,
      directorId: directorId || null,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Region created successfully',
    data: { ...region, _id: region.id },
  });
});

// @desc    Update region
// @route   PUT /api/regions/:id
// @access  Private (Admin)
export const updateRegion = asyncHandler(async (req, res) => {
  const existingRegion = await prisma.region.findUnique({
    where: { id: req.params.id },
  });

  if (!existingRegion) {
    return res.status(404).json({
      success: false,
      message: 'Region not found',
    });
  }

  const region = await prisma.region.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.status(200).json({
    success: true,
    message: 'Region updated successfully',
    data: { ...region, _id: region.id },
  });
});

// @desc    Delete region (soft delete)
// @route   DELETE /api/regions/:id
// @access  Private (Admin)
export const deleteRegion = asyncHandler(async (req, res) => {
  const region = await prisma.region.findUnique({
    where: { id: req.params.id },
  });

  if (!region) {
    return res.status(404).json({
      success: false,
      message: 'Region not found',
    });
  }

  // Soft delete - set isActive to false
  const updatedRegion = await prisma.region.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.status(200).json({
    success: true,
    message: 'Region deactivated successfully',
    data: { ...updatedRegion, _id: updatedRegion.id },
  });
});
