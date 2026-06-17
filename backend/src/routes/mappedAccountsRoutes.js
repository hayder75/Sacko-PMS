import express from 'express';
import {
  getMappedAccountsDashboard,
  getAccountDetail,
} from '../controllers/mappedAccountsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, getMappedAccountsDashboard);
router.get('/account/:accountNumber', protect, getAccountDetail);

export default router;
