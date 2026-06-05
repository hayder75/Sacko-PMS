import express from 'express';
import {
  getHQDashboard,
  getRegionalDashboard,
  getAreaDashboard,
  getBranchDashboard,
  getStaffDashboard,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { isHQAdmin, isRegionalDirector, isAreaManager, isBranchManager, isStaff } from '../middleware/rbac.js';

const router = express.Router();

router.get('/hq', protect, isHQAdmin, getHQDashboard);
router.get('/regional', protect, isRegionalDirector, getRegionalDashboard);
router.get('/area', protect, isAreaManager, getAreaDashboard);
router.get('/branch', protect, isBranchManager, getBranchDashboard);
router.get('/staff', protect, isStaff, getStaffDashboard);

export default router;

