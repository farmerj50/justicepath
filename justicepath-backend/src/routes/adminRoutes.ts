import express from 'express';
import {
  getUserSummary,
  getDashboardStats, // ✅ New controller
} from '../controllers/adminController';
import { checkRole } from '../middleware/checkRole';
import authenticate from '../middleware/authMiddleware';

const router = express.Router();

// ✅ Existing route (do not remove)
router.get('/user-summary', authenticate, checkRole(['ADMIN']), getUserSummary);

// ✅ New dashboard stats route
router.get('/dashboard-stats', authenticate, checkRole(['ADMIN']), getDashboardStats);

export default router;
