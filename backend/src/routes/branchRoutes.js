import express from 'express';
import {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { protect } from '../middleware/auth.js';
import { isHQAdmin } from '../middleware/rbac.js';

const router = express.Router();

// All branch routes require Admin access
router.route('/')
  .get(protect, isHQAdmin, getBranches)
  .post(protect, isHQAdmin, createBranch);

router.route('/:id')
  .get(protect, isHQAdmin, getBranch)
  .put(protect, isHQAdmin, updateBranch)
  .delete(protect, isHQAdmin, deleteBranch);

export default router;

