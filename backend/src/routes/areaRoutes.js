import express from 'express';
import {
  getAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea,
} from '../controllers/areaController.js';
import { protect } from '../middleware/auth.js';
import { isHQAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .get(protect, isHQAdmin, getAreas)
  .post(protect, isHQAdmin, createArea);

router.route('/:id')
  .get(protect, isHQAdmin, getArea)
  .put(protect, isHQAdmin, updateArea)
  .delete(protect, isHQAdmin, deleteArea);

export default router;

