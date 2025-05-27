import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SelectPlan: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const choosePlan = async (plan: string) => {
  if (!user?.id) {
    console.error('❌ User ID is missing. Redirecting to login.');
    navigate('/login');
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/set-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, plan }),
    });

    if (res.ok) {
      const updatedUser = { ...user, plan };
      localStorage.setItem('justicepath-user', JSON.stringify(updatedUser));
      navigate('/dashboard');
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
    { title: 'Free Plan', value: 'free', features: ['1 document/month', 'Basic support'] },
    { title: 'Basic Plan', value: 'basic', features: ['5 documents/month', 'Email support'] },
    { title: 'Pro Plan', value: 'pro', features: ['Unlimited documents', 'Priority support'] },
  ];

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Select a Plan</h1>
      <div style={styles.grid}>
        {plans.map((plan) => (
          <div key={plan.value} style={styles.card}>
            <h2 style={styles.planTitle}>{plan.title}</h2>
            <ul style={styles.featureList}>
              {plan.features.map((feat, i) => (
                <li key={i} style={styles.featureItem}>• {feat}</li>
              ))}
            </ul>
            <button style={styles.button} onClick={() => choosePlan(plan.value)}>
              Choose {plan.value}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#000',
    minHeight: '100vh',
    padding: '2rem',
    color: '#fff',
    textAlign: 'center',
  },
  heading: {
    fontSize: '2rem',
    marginBottom: '2rem',
  },
  grid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#111827',
    padding: '2rem',
    borderRadius: '1rem',
    width: '250px',
    boxShadow: '0 0 12px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: '1.2rem',
    marginBottom: '1rem',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '1.5rem',
  },
  featureItem: {
    fontSize: '0.95rem',
    margin: '0.25rem 0',
  },
  button: {
    padding: '0.5rem 1.25rem',
    borderRadius: '999px',
    background: 'linear-gradient(to right, #4f46e5, #6366f1)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default SelectPlan;
