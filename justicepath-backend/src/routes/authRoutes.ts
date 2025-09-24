import express from 'express';

// If your middleware is a default export, keep this:
import authenticate from '../middleware/authMiddleware';
// If it's a named export, use:
// import { authenticate } from '../middleware/authMiddleware';

import { signupLimiter, loginLimiter } from '../middleware/rateLimiters';

// ⬇️ Match the actual filename exactly (case-sensitive in prod)
import {
  registerUser,
  loginUser,
  refreshSession,
  getProfile,
  resetPassword,
  verifyEmail,
} from '../controllers/authControllers';

const router = express.Router();

router.get('/test', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is alive in prod 🚀' });
});

// Auth
router.post('/register', signupLimiter, registerUser);
router.post('/login',    loginLimiter,  loginUser);
router.post('/refresh',  refreshSession);

// Profile & password
router.get('/me', authenticate, getProfile);
router.post('/reset-password', authenticate, resetPassword);
router.get('/auth/verify', verifyEmail);



export default router;
