import express from 'express';
import {
  getRegions,
  getRegion,
  createRegion,
  updateRegion,
  deleteRegion,
} from '../controllers/regionController.js';
import { protect } from '../middleware/auth.js';
import { isHQAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .get(protect, isHQAdmin, getRegions)
  .post(protect, isHQAdmin, createRegion);

router.route('/:id')
  .get(protect, isHQAdmin, getRegion)
  .put(protect, isHQAdmin, updateRegion)
  .delete(protect, isHQAdmin, deleteRegion);

export default router;

