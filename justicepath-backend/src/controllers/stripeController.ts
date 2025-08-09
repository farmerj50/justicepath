// src/controllers/stripeController.ts
import Stripe from 'stripe';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const createCheckoutSession = async (req: Request, res: Response) => {
  const { plan } = req.body;

  try {
    const priceId = getStripePriceId(plan); // 🔁 map plan to price ID

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_ORIGIN}/login?payment=success`,
      cancel_url: `${process.env.FRONTEND_ORIGIN}/select-plan?payment=cancelled`,
    });

    res.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Add this helper function
function getStripePriceId(plan: string) {
  switch (plan) {
    case 'PLUS': {
      const priceId = process.env.STRIPE_PLUS_PRICE_ID;
      if (!priceId) throw new Error('Missing STRIPE_PLUS_PRICE_ID in env');
      return priceId;
    }
    case 'PRO': {
      const priceId = process.env.STRIPE_PRO_PRICE_ID;
      if (!priceId) throw new Error('Missing STRIPE_PRO_PRICE_ID in env');
      return priceId;
    }
    default:
      throw new Error(`Invalid plan: ${plan}`);
  }
}

