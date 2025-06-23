import React from 'react';
import { useAuth } from '../context/AuthContext';

const PlanDetails: React.FC = () => {
  const auth = useAuth();
  if (!auth) return null;

  const { user, loading } = auth;

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
    free: [
      '✓ Basic AI document drafting',
      '✓ 1 document per month',
      '✓ Access to limited case types',
      '✓ No file upload',
      '✓ Email-only support'
    ],
    plus: [
      '✓ Everything in Free',
      '✓ Upload scanned files, images, PDFs',
      '✓ AI analysis of uploads with case matching',
      '✓ Document storage and dashboard access',
      '✓ Faster processing speed',
      '✓ Email + Chat support'
    ],
    pro: [
      '✓ Everything in Plus',
      '✓ Live trial prep suggestions',
      '✓ Voice-to-text transcription',
      '✓ AI-generated outlines and arguments',
      '✓ Multiple follow-up questions per document',
      '✓ Priority AI access and dedicated support'
    ]
  };

  const features = planDescriptions[plan] || [];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome to the {tier.charAt(0) + tier.slice(1).toLowerCase()} Plan
      </h1>
      <ul className="list-none space-y-3 text-green-400 text-lg">
        {features.map((feat, i) => (
          <li key={i}>{feat}</li>
        ))}
      </ul>
    </div>
  );
};

export default PlanDetails;
