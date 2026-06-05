import express from 'express';
import {
  getPlanShareConfigs,
  getPlanShareConfig,
  createPlanShareConfig,
  updatePlanShareConfig,
  deletePlanShareConfig,
} from '../controllers/planShareConfigController.js';
import { protect } from '../middleware/auth.js';
import { isHQAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .get(protect, isHQAdmin, getPlanShareConfigs)
  .post(protect, isHQAdmin, createPlanShareConfig);

router.route('/:id')
  .get(protect, isHQAdmin, getPlanShareConfig)
  .put(protect, isHQAdmin, updatePlanShareConfig)
  .delete(protect, isHQAdmin, deletePlanShareConfig);

export default router;

