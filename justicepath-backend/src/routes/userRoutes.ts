import express from 'express';
import { setUserPlan } from '../controllers/userController';

const router = express.Router();

router.post('/set-plan', setUserPlan);

export default router;

