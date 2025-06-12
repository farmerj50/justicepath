import express from 'express';
import { getUserSummary } from '../controllers/adminController';
import { checkRole } from '../middleware/checkRole'; // ✅ named import
import authenticate from '../middleware/authMiddleware';

const router = express.Router();

// ✅ Apply middleware: allow only 'ADMIN' users
router.get('/user-summary', authenticate, checkRole(['ADMIN']), getUserSummary);


export default router;
