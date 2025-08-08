import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

const StripeCheckout = () => {
  const handleCheckout = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    const stripe = await stripePromise;
    stripe?.redirectToCheckout({ sessionId: data.sessionId });
  };

  return (
    <button onClick={handleCheckout} className="bg-yellow-500 text-black px-4 py-2 rounded">
      Upgrade to Premium
    </button>
  );
};

export default StripeCheckout;
