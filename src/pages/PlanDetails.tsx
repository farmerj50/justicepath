import React from 'react';
import { useAuth } from '../context/AuthContext';

const PlanDetails: React.FC = () => {
  const auth = useAuth();
  if (!auth) return null;
  const { user } = auth;

  if (!user) return <p>Loading...</p>;

  // Safely normalize plan from tier
  const tier = (user.tier || 'FREE').toUpperCase(); // Always uppercase
  const plan = tier; // You’re using the enum string directly now


  const planDescriptions: Record<string, string[]> = {
    free: ['1 document per month', 'Basic support'],
    plus: ['5 documents per month', 'Email support'],
    pro: ['Unlimited documents', 'Priority support'],
  };

  const features = planDescriptions[plan] || [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">
        Welcome to the {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
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
