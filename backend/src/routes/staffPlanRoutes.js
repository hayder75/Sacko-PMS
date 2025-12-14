import express from 'express';
import {
  getStaffPlans,
  getStaffPlan,
} from '../controllers/staffPlanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getStaffPlans);

router.route('/:id')
  .get(protect, getStaffPlan);

export default router;



