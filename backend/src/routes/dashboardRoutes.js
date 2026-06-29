import express from 'express';
import {
  getHQDashboard,
  getAreaDashboard,
  getBranchDashboard,
  getStaffDashboard,
  getSupervisorDashboard,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin, isAreaManager, isBranchManager, isSupervisor, isStaff } from '../middleware/rbac.js';

const router = express.Router();

router.get('/hq', protect, isAdmin, getHQDashboard);
router.get('/area', protect, isAreaManager, getAreaDashboard);
router.get('/branch', protect, isBranchManager, getBranchDashboard);
router.get('/staff', protect, isStaff, getStaffDashboard);
router.get('/supervisor', protect, isSupervisor, getSupervisorDashboard);

export default router;
