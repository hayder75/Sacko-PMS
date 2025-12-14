import express from 'express';
import {
  getTeams,
  createTeam,
  getSubTeams,
  createSubTeam,
  updateSubTeam,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';
import { isBranchManager } from '../middleware/rbac.js';

const router = express.Router();

router.route('/teams')
  .get(protect, isBranchManager, getTeams)
  .post(protect, isBranchManager, createTeam);

router.route('/sub-teams')
  .get(protect, isBranchManager, getSubTeams)
  .post(protect, isBranchManager, createSubTeam);

router.route('/sub-teams/:id')
  .put(protect, isBranchManager, updateSubTeam);

export default router;

