import express from 'express';
import { registerUser, loginUser, getProfile, resetPassword } from '../controllers/authControllers';
import authenticate from '../middleware/authMiddleware';

const router = express.Router();
router.get('/test', (req, res) => {
  res.status(200).json({ success: true, message: 'API is alive in prod 🚀' });
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getProfile);
router.post('/reset-password', authenticate, resetPassword);

export default router;
