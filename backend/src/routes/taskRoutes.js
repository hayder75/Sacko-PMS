import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  approveTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { canApprove } from '../middleware/rbac.js';

const router = express.Router();

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.get('/:id', protect, getTask);
router.put('/:id/approve', protect, canApprove, approveTask);

export default router;

