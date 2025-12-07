import express from 'express';
import {
  createBehavioralEvaluation,
  getBehavioralEvaluations,
  approveBehavioralEvaluation,
} from '../controllers/behavioralController.js';
import { protect } from '../middleware/auth.js';
import { canApprove } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .get(protect, getBehavioralEvaluations)
  .post(protect, createBehavioralEvaluation);

router.put('/:id/approve', protect, canApprove, approveBehavioralEvaluation);

export default router;

