import express from 'express';
import {
  createPlan,
  uploadPlan,
  getPlans,
  getPlan,
  updatePlan,
} from '../controllers/planController.js';
import { protect } from '../middleware/auth.js';
import { isHQAdmin } from '../middleware/rbac.js';
import { upload } from '../utils/fileUpload.js';

const router = express.Router();

router.post('/', protect, isHQAdmin, createPlan); // Manual plan creation
router.post('/upload', protect, isHQAdmin, upload.single('planFile'), uploadPlan);
router.get('/', protect, getPlans);
router.get('/:id', protect, getPlan);
router.put('/:id', protect, isHQAdmin, updatePlan);

export default router;

