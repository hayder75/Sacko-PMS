import express from 'express';
import {
  getPlanShareConfigs,
  getPlanShareConfig,
  createPlanShareConfig,
  updatePlanShareConfig,
  deletePlanShareConfig,
} from '../controllers/planShareConfigController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .get(protect, isAdmin, getPlanShareConfigs)
  .post(protect, isAdmin, createPlanShareConfig);

router.route('/:id')
  .get(protect, isAdmin, getPlanShareConfig)
  .put(protect, isAdmin, updatePlanShareConfig)
  .delete(protect, isAdmin, deletePlanShareConfig);

export default router;

