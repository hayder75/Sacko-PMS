import express from 'express';
import {
  getMappings,
  createMapping,
  updateMapping,
  autoBalanceMapping,
} from '../controllers/mappingController.js';
import { protect } from '../middleware/auth.js';
import { isManagerOrAbove } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .get(protect, getMappings)
  .post(protect, isManagerOrAbove, createMapping);

router.put('/:id', protect, isManagerOrAbove, updateMapping);
router.post('/auto-balance', protect, isManagerOrAbove, autoBalanceMapping);

export default router;

