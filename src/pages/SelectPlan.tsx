import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from '../components/Navbar'; // ✅ Optional if consistent with other pages

const SelectPlan: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  if (!auth) return null;
  const { user, setUser } = auth;

  const choosePlan = async (plan: string) => {
    const upperPlan = plan.toUpperCase();
    const lowerPlan = plan.toLowerCase();
    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('justicepath-token');
    const isLoggedIn = !!(user?.id && token);

    localStorage.setItem('pending-plan', upperPlan);

    if (upperPlan === 'FREE') {
      if (!isLoggedIn) {
        alert('Free plan saved. Please log in to apply it.');
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_URL}/api/set-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, plan: upperPlan }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('❌ Failed to update FREE plan:', err);
        alert('Could not update plan. Please try again.');
        return;
      }

      const updatedUser: User = {
        ...user,
        plan: lowerPlan as 'free',
        tier: upperPlan as 'FREE',
      };

      setUser(updatedUser);
      localStorage.setItem('justicepath-user', JSON.stringify(updatedUser));
      localStorage.removeItem('pending-plan');
      navigate('/login');
      return;
    }

    try {
      const stripeRes = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan: upperPlan, userId: user?.id || null }),
      });

      if (!stripeRes.ok) {
        const err = await stripeRes.json();
        console.error('❌ Stripe session error:', err);
        alert('Unable to initiate payment. Please try again.');
        return;
      }

      const { sessionId } = await stripeRes.json();
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (!stripe) throw new Error('Stripe failed to initialize.');

      await stripe.redirectToCheckout({ sessionId });
    } catch (err) {
      console.error('❌ Stripe redirect error:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-black min-h-screen py-16 px-4 text-white text-center">
        <h1 className="text-3xl font-bold mb-10">Choose Your Plan</h1>
        <div className="flex flex-wrap justify-center gap-8">
          {/* Free Plan */}
          <div className="bg-gray-800 text-white rounded-xl p-6 w-full max-w-xs flex flex-col justify-between min-h-[400px]">
            <div>
              <h2 className="text-2xl font-bold text-center mb-2">Free</h2>
              <p className="text-center text-3xl font-semibold mb-2">
                $0 <span className="text-sm">/mo</span>
              </p>
              <ul className="text-left space-y-2 mt-4">
                <li className="text-green-400">✓ Basic AI document drafting</li>
                <li className="text-green-400">✓ 1 document per month</li>
                <li className="text-green-400">✓ Access to limited case types</li>
                <li className="text-green-400">✓ No file upload</li>
                <li className="text-green-400">✓ Email-only support</li>
              </ul>
            </div>
            <button
              onClick={() => choosePlan('FREE')}
              className="mt-6 bg-indigo-500 text-white py-2 rounded-full"
            >
              Select
            </button>
          </div>

          {/* Plus Plan */}
          <div className="bg-gray-800 text-white rounded-xl p-6 w-full max-w-xs flex flex-col justify-between min-h-[400px]">
            <div>
              <h2 className="text-2xl font-bold text-center mb-2">Plus</h2>
              <p className="text-center text-3xl font-semibold mb-2">
                $5 <span className="text-sm">/mo</span>
              </p>
              <ul className="text-left space-y-2 mt-4">
                <li className="text-green-400">✓ Everything in Free</li>
                <li className="text-green-400">✓ Upload scanned files, images, PDFs</li>
                <li className="text-green-400">✓ AI analysis of uploads with case matching</li>
                <li className="text-green-400">✓ Document storage and dashboard access</li>
                <li className="text-green-400">✓ Faster processing speed</li>
                <li className="text-green-400">✓ Email + Chat support</li>
              </ul>
            </div>
            <button
              onClick={() => choosePlan('PLUS')}
              className="mt-6 bg-indigo-500 text-white py-2 rounded-full"
            >
              Select
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gray-800 text-white rounded-xl p-6 w-full max-w-xs flex flex-col justify-between min-h-[400px]">
            <div>
              <h2 className="text-2xl font-bold text-center mb-2">Pro</h2>
              <p className="text-center text-3xl font-semibold mb-2">
                $10 <span className="text-sm">/mo</span>
              </p>
              <ul className="text-left space-y-2 mt-4">
                <li className="text-green-400">✓ Everything in Plus</li>
                <li className="text-green-400">✓ Live trial prep suggestions</li>
                <li className="text-green-400">✓ Voice-to-text transcription</li>
                <li className="text-green-400">✓ AI-generated outlines and arguments</li>
                <li className="text-green-400">✓ Multiple follow-up questions per document</li>
                <li className="text-green-400">✓ Priority AI access and dedicated support</li>
              </ul>
            </div>
            <button
              onClick={() => choosePlan('PRO')}
              className="mt-6 bg-indigo-500 text-white py-2 rounded-full"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectPlan;
