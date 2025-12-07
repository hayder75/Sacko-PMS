import ProductKpiMapping from '../models/ProductKpiMapping.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all product mappings
// @route   GET /api/product-mappings
// @access  Private (Admin)
export const getAllMappings = asyncHandler(async (req, res) => {
  const { status, kpi_category } = req.query;

  const query = {};
  if (status) query.status = status;
  if (kpi_category) query.kpi_category = kpi_category;

  const mappings = await ProductKpiMapping.find(query)
    .populate('mapped_by', 'name email')
    .sort({ cbs_product_name: 1 });

  res.status(200).json({
    success: true,
    count: mappings.length,
    data: mappings,
  });
});

// @desc    Get single product mapping
// @route   GET /api/product-mappings/:productName
// @access  Private (Admin)
export const getMapping = asyncHandler(async (req, res) => {
  const { productName } = req.params;

  const mapping = await ProductKpiMapping.findOne({
    cbs_product_name: productName,
  }).populate('mapped_by', 'name email');

  if (!mapping) {
    return res.status(404).json({
      success: false,
      message: 'Product mapping not found',
    });
  }

  res.status(200).json({
    success: true,
    data: mapping,
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

  // Check if mapping already exists
  const existing = await ProductKpiMapping.findOne({
    cbs_product_name: cbs_product_name.trim(),
  });

  let mapping;
  if (existing) {
    // Update existing
    existing.kpi_category = kpi_category;
    existing.conditions = conditions || existing.conditions;
    existing.notes = notes || existing.notes;
    existing.status = 'active';
    existing.mapped_by = req.user._id;
    existing.mapped_at = new Date();
    await existing.save();
    mapping = existing;
  } else {
    // Create new
    mapping = await ProductKpiMapping.create({
      cbs_product_name: cbs_product_name.trim(),
      kpi_category,
      conditions: conditions || {},
      notes,
      mapped_by: req.user._id,
      status: 'active',
    });
  }

  await logAudit(
    req.user._id,
    'Product Mapping',
    'ProductKpiMapping',
    mapping._id,
    `${cbs_product_name} → ${kpi_category}`,
    existing ? 'Updated product mapping' : 'Created product mapping',
    req
  );

  res.status(existing ? 200 : 201).json({
    success: true,
    message: existing ? 'Product mapping updated' : 'Product mapping created',
    data: mapping,
  });
});

// @desc    Bulk create product mappings
// @route   POST /api/product-mappings/bulk
// @access  Private (Admin)
export const bulkCreateMappings = asyncHandler(async (req, res) => {
  const { mappings } = req.body;

  if (!Array.isArray(mappings) || mappings.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'mappings array is required',
    });
  }

  const results = {
    created: 0,
    updated: 0,
    errors: [],
  };

  for (const mappingData of mappings) {
    try {
      const { cbs_product_name, kpi_category, conditions, notes } = mappingData;

      if (!cbs_product_name || !kpi_category) {
        results.errors.push(`Missing required fields: ${JSON.stringify(mappingData)}`);
        continue;
      }

      const existing = await ProductKpiMapping.findOne({
        cbs_product_name: cbs_product_name.trim(),
      });

      if (existing) {
        existing.kpi_category = kpi_category;
        existing.conditions = conditions || existing.conditions;
        existing.notes = notes || existing.notes;
        existing.status = 'active';
        existing.mapped_by = req.user._id;
        existing.mapped_at = new Date();
        await existing.save();
        results.updated++;
      } else {
        await ProductKpiMapping.create({
          cbs_product_name: cbs_product_name.trim(),
          kpi_category,
          conditions: conditions || {},
          notes,
          mapped_by: req.user._id,
          status: 'active',
        });
        results.created++;
      }
    } catch (error) {
      results.errors.push(`Error processing ${mappingData.cbs_product_name}: ${error.message}`);
    }
  }

  await logAudit(
    req.user._id,
    'Bulk Product Mapping',
    'ProductKpiMapping',
    null,
    'Bulk Import',
    `Created ${results.created}, Updated ${results.updated}`,
    req
  );

  res.status(200).json({
    success: true,
    message: `Processed ${results.created + results.updated} mappings`,
    data: results,
  });
});

// @desc    Get unmapped products from CBS files
// @route   GET /api/product-mappings/unmapped
// @access  Private (Admin)
export const getUnmappedProducts = asyncHandler(async (req, res) => {
  // This will be populated from CBS validation records
  // For now, return empty array - will be implemented in CBS controller
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
  const { id } = req.params;

  const mapping = await ProductKpiMapping.findById(id);

  if (!mapping) {
    return res.status(404).json({
      success: false,
      message: 'Product mapping not found',
    });
  }

  await mapping.deleteOne();

  await logAudit(
    req.user._id,
    'Product Mapping Deleted',
    'ProductKpiMapping',
    id,
    mapping.cbs_product_name,
    'Deleted product mapping',
    req
  );

  res.status(200).json({
    success: true,
    message: 'Product mapping deleted',
  });
});

