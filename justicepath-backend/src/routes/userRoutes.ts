// routes/userRoutes.ts
import express from 'express';
import { setUserPlan } from '../controllers/userController';
import { registerUser, loginUser, getProfile } from '../controllers/authControllers'

const router = express.Router();

// Auth-related routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getProfile);

// Plan-related route
router.post('/set-plan', setUserPlan);

export default router;
