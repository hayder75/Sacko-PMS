import express from 'express';
import {
  calculatePerformance,
  getPerformanceScores,
  getPerformanceScore,
} from '../controllers/performanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/calculate', protect, calculatePerformance);
router.get('/', protect, getPerformanceScores);
router.get('/:id', protect, getPerformanceScore);

export default router;

