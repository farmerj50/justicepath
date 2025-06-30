import express from 'express';
import { registerUser, loginUser, getProfile } from '../controllers/authControllers';
import authenticate from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getProfile);

export default router;
