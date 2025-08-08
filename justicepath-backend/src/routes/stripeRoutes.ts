// src/routes/stripeRoutes.ts
import express from 'express';
import { createCheckoutSession } from '../controllers/stripeController';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);

export default router;
