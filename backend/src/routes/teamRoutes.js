import express from 'express';
import {
  getTeams,
  createTeam,
  deleteTeam,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';
import { isBranchManager } from '../middleware/rbac.js';

const router = express.Router();

router.route('/teams')
  .get(protect, isBranchManager, getTeams)
  .post(protect, isBranchManager, createTeam);

router.route('/teams/:id')
  .delete(protect, isBranchManager, deleteTeam);

export default router;
