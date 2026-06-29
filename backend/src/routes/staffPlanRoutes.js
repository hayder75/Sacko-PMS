import express from 'express';
import {
  getStaffPlans,
  getStaffPlan,
  createStaffPlan,
  updateStaffPlan,
  deleteStaffPlan,
} from '../controllers/staffPlanController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin, isBranchManager } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', protect, getStaffPlans);
router.get('/:id', protect, getStaffPlan);
router.post('/', protect, isAdmin, createStaffPlan);
router.put('/:id', protect, isAdmin, updateStaffPlan);
router.delete('/:id', protect, isAdmin, deleteStaffPlan);

export default router;
