import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';
import { KPI_CATEGORY_TO_ENUM } from '../utils/prismaHelpers.js';

// @desc    Get all product mappings
// @route   GET /api/product-mappings
// @access  Private (Admin)
export const getAllMappings = asyncHandler(async (req, res) => {
  const { status, kpi_category } = req.query;

  const where = {};
  if (status) where.status = status;
  if (kpi_category) where.kpi_category = KPI_CATEGORY_TO_ENUM[kpi_category] || kpi_category;

  const mappings = await prisma.productKpiMapping.findMany({
    where,
    include: {
      mapped_by: { select: { id: true, name: true, email: true } },
    },
    orderBy: { cbs_product_name: 'asc' },
  });

  res.status(200).json({
    success: true,
    count: mappings.length,
    data: mappings.map(m => ({ ...m, _id: m.id })),
  });
});

// @desc    Get single product mapping
// @route   GET /api/product-mappings/:productName
// @access  Private (Admin)
export const getMapping = asyncHandler(async (req, res) => {
  const { productName } = req.params;

  const mapping = await prisma.productKpiMapping.findUnique({
    where: { cbs_product_name: productName },
    include: {
      mapped_by: { select: { id: true, name: true, email: true } },
    },
  });

  if (!mapping) {
    return res.status(404).json({
      success: false,
      message: 'Product mapping not found',
    });
  }

  res.status(200).json({
    success: true,
    data: { ...mapping, _id: mapping.id },
  });
});

// @desc    Create or update product mapping
// @route   POST /api/product-mappings
// @access  Private (Admin)
export const createMapping = asyncHandler(async (req, res) => {
  const { cbs_product_name, kpi_category, conditions, notes } = req.body;

  if (!cbs_product_name || !kpi_category) {
    return res.status(400).json({
      success: false,
      message: 'cbs_product_name and kpi_category are required',
    });
  }

  const kpiEnum = KPI_CATEGORY_TO_ENUM[kpi_category] || kpi_category;
  const productName = cbs_product_name.trim();

  const mapping = await prisma.productKpiMapping.upsert({
    where: { cbs_product_name: productName },
    update: {
      kpi_category: kpiEnum,
      conditions: conditions || {},
      notes,
      status: 'active',
      mapped_by_id: req.user.id,
      mapped_at: new Date(),
    },
    create: {
      cbs_product_name: productName,
      kpi_category: kpiEnum,
      conditions: conditions || {},
      notes,
      mapped_by_id: req.user.id,
      status: 'active',
    },
  });

  await logAudit(
    req.user.id,
    'Product Mapping',
    'ProductKpiMapping',
    mapping.id,
    `${productName} → ${kpi_category}`,
    'Created/Updated product mapping',
    req
  );

  res.status(200).json({
    success: true,
    data: { ...mapping, _id: mapping.id },
  });
});

// @desc    Bulk create product mappings
// @route   POST /api/product-mappings/bulk
// @access  Private (Admin)
export const bulkCreateMappings = asyncHandler(async (req, res) => {
  const { mappings } = req.body;

  if (!Array.isArray(mappings) || mappings.length === 0) {
    return res.status(400).json({ success: false, message: 'mappings array is required' });
  }

  const results = { created: 0, updated: 0, errors: [] };

  for (const mData of mappings) {
    try {
      const { cbs_product_name, kpi_category, conditions, notes } = mData;
      if (!cbs_product_name || !kpi_category) continue;

      const kpiEnum = KPI_CATEGORY_TO_ENUM[kpi_category] || kpi_category;

      await prisma.productKpiMapping.upsert({
        where: { cbs_product_name: cbs_product_name.trim() },
        update: {
          kpi_category: kpiEnum,
          conditions: conditions || {},
          notes,
          mapped_by_id: req.user.id,
          mapped_at: new Date(),
        },
        create: {
          cbs_product_name: cbs_product_name.trim(),
          kpi_category: kpiEnum,
          conditions: conditions || {},
          notes,
          mapped_by_id: req.user.id,
        }
      });
      results.created++; // Simplified count
    } catch (e) {
      results.errors.push(e.message);
    }
  }

  res.status(200).json({ success: true, data: results });
});

// @desc    Get unmapped products from CBS files
// @route   GET /api/product-mappings/unmapped
// @access  Private (Admin)
export const getUnmappedProducts = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Unmapped products will be shown here after CBS uploads',
  });
});


// @desc    Delete product mapping
// @route   DELETE /api/product-mappings/:id
// @access  Private (Admin)
export const deleteMapping = asyncHandler(async (req, res) => {
  const mapping = await prisma.productKpiMapping.findUnique({ where: { id: req.params.id } });
  if (!mapping) return res.status(404).json({ success: false, message: 'Not found' });

  await prisma.productKpiMapping.delete({ where: { id: req.params.id } });

  res.status(200).json({ success: true, message: 'Deleted' });
});
