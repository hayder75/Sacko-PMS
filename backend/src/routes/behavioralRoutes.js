import express from 'express';
import {
  getEvaluations,
  getEvaluation,
  createEvaluation,
  updateEvaluation,
  approveEvaluation,
} from '../controllers/behavioralController.js';
import { protect } from '../middleware/auth.js';
import { isSupervisor, isBranchManager, isAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', protect, getEvaluations);
router.get('/:id', protect, getEvaluation);
router.post('/', protect, isSupervisor, createEvaluation);
router.put('/:id', protect, updateEvaluation);
router.put('/:id/approve', protect, isBranchManager, approveEvaluation);

export default router;
