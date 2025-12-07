import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { isHQAdmin, isManagerOrAbove } from '../middleware/rbac.js';

const router = express.Router();

// GET: Only HQ Admin can see all users
router.route('/')
  .get(protect, isHQAdmin, getUsers)
  // POST: Managers and above can create users (authorization checked in controller)
  .post(protect, isManagerOrAbove, createUser);

router.route('/:id')
  .get(protect, getUser)
  .put(protect, isHQAdmin, updateUser)
  .delete(protect, isHQAdmin, deleteUser);

router.put('/:id/reset-password', protect, isHQAdmin, resetPassword);

export default router;

