import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../context/AuthContext';


const SelectPlan: React.FC = () => {
  const auth = useAuth();
  if (!auth) return null;
  const { user, setUser } = auth;

  
  const navigate = useNavigate();

  const choosePlan = async (plan: string) => {
    if (!user || !user.id) {
      console.warn('User not loaded or missing ID');
      alert('You must be logged in to select a plan');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/set-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          plan: plan.toUpperCase(),
        }),
      });

      if (res.ok) {
        const updatedUser = {
          ...user,
          tier: (plan.toUpperCase() as 'FREE' | 'PLUS' | 'PRO'),
          plan: plan.toLowerCase(),
        } as User;
        localStorage.setItem('justicepath-user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        navigate('/plan-details');
      } else {
        const err = await res.json();
        console.error('❌ Failed to update plan:', err);
        alert('Could not update plan. Please try again.');
      }
    } catch (err) {
      console.error('❌ Network or server error while updating plan:', err);
      alert('Something went wrong. Please try again later.');
    }
  };

  const plans = [
    {
      title: 'Free Plan',
      value: 'FREE',
      features: ['1 document/month', 'Basic support'],
    },
    {
      title: 'Plus Plan',
      value: 'PLUS',
      features: ['5 documents/month', 'Email support'],
    },
    {
      title: 'Pro Plan',
      value: 'PRO',
      features: ['Unlimited documents', 'Priority support'],
    },
  ];

  return (
    <div className="bg-black min-h-screen px-4 py-10 text-white text-center">
      <h1 className="text-3xl font-bold mb-10">Select a Plan</h1>
      <div className="flex flex-wrap justify-center gap-8">
        {plans.map((plan) => (
          <div
            key={plan.value}
            className="bg-zinc-800 p-6 rounded-xl w-72 shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-4">{plan.title}</h2>
            <ul className="text-sm mb-6">
              {plan.features.map((feat, i) => (
                <li key={i} className="mb-1">• {feat}</li>
              ))}
            </ul>
            <button
              onClick={() => choosePlan(plan.value)}
              className="w-full py-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 text-white font-bold hover:opacity-90 transition"
            >
              Choose {plan.value}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectPlan;
