import React from 'react';
import { useAuth } from '../context/AuthContext';

const PlanDetails: React.FC = () => {
  const auth = useAuth();
  if (!auth) return null;

  const { user, loading } = auth;

  // Show loading state while auth is still hydrating
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-lg">No user found. Please log in.</p>
      </div>
    );
  }

  const tier = (user.tier || 'FREE').toUpperCase();
  const plan = tier.toLowerCase(); // for lookup

  const planDescriptions: Record<string, string[]> = {
    free: ['1 document per month', 'Basic support'],
    plus: ['5 documents per month', 'Email support'],
    pro: ['Unlimited documents', 'Priority support'],
  };

  const features = planDescriptions[plan] || [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">
        Welcome to the {tier.charAt(0) + tier.slice(1).toLowerCase()} Plan
      </h1>
      <ul className="list-disc space-y-2">
        {features.map((feat, i) => (
          <li key={i}>{feat}</li>
        ))}
      </ul>
    </div>
  );
};

export default PlanDetails;
