import express from 'express';
import {
  getAllMappings,
  getMapping,
  createMapping,
  bulkCreateMappings,
  getUnmappedProducts,
  deleteMapping,
} from '../controllers/productKpiMappingController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', protect, isAdmin, getAllMappings);
router.get('/unmapped', protect, isAdmin, getUnmappedProducts);
router.get('/:productName', protect, isAdmin, getMapping);
router.post('/', protect, isAdmin, createMapping);
router.post('/bulk', protect, isAdmin, bulkCreateMappings);
router.delete('/:id', protect, isAdmin, deleteMapping);

export default router;

