import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const API_URL = import.meta.env.VITE_API_URL;


    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', 
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || 'Invalid credentials');
        return;
      }

      const { user, token } = await res.json();

      localStorage.setItem('justicepath-auth', token);
      localStorage.setItem('justicepath-user', JSON.stringify(user));
      localStorage.setItem('justicepath-token', token);

      const pendingPlan = localStorage.getItem('pending-plan');

      if (pendingPlan && user?.id) {
        try {
          console.log('📤 Sending plan update:', {
             url: `${API_URL}/api/set-plan`,
             userId: user.id,
             plan: pendingPlan,
             token,
         });

          const planRes = await fetch(`${API_URL}/api/set-plan`, {

            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId: user.id,
              plan: pendingPlan,
            }),
          });

          if (planRes.ok) {
            console.log('✅ Applied pending plan:', pendingPlan);
            localStorage.removeItem('pending-plan');

            await wait (500);

            const profileRes = await fetch(`${API_URL}/api/profile`, {

              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });

            if (planRes.ok) {
  console.log('✅ Applied pending plan:', pendingPlan);
  localStorage.removeItem('pending-plan');

  // ✅ Manually update user object
  const updatedUser = { ...user, plan: pendingPlan };
  localStorage.setItem('justicepath-user', JSON.stringify(updatedUser));
  setUser(updatedUser);

  // ✅ Conditional redirects based on role and updated plan
  if (updatedUser.role === 'ADMIN') {
    navigate('/admin-dashboard');
  } else if (!updatedUser.plan) {
    navigate('/select-plan');
  } else {
    navigate('/case-type-selection');
  }

  return;


            } else {
              console.warn('⚠️ Failed to fetch updated user after applying plan.');
              navigate('/select-plan');
              return;
            }
          } else {
            console.warn('⚠️ Failed to apply pending plan.');
            navigate('/select-plan');
            return;
          }
        } catch (applyErr) {
          console.error('❌ Error applying pending plan:', applyErr);
          navigate('/select-plan');
          return;
        }
      }

      // ✅ Fallback if there's no pendingPlan logic
      setUser(user);

      if (user.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else if (!user.plan) {
        navigate('/select-plan');
      } else {
        navigate('/case-type-selection');
      }

    } catch (err) {
      console.error('Login request failed:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div style={{
        backgroundColor: '#000',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        padding: '1rem'
      }}>
        <form onSubmit={handleLogin} style={{
          backgroundColor: '#111827',
          padding: '2rem',
          borderRadius: '1rem',
          maxWidth: '400px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2 style={{ fontSize: '1.8rem' }}>Login</h2>
          {error && <p style={{ color: 'salmon' }}>{error}</p>}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>Login</button>
          <p style={{ fontSize: '0.85rem', textAlign: 'center', color: '#888' }}>
            Don't have an account? <a href="/signup" style={{ color: '#6366f1' }}>Sign up</a>
          </p>
        </form>
      </div>
    </>
  );
};

const inputStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid #444',
  backgroundColor: '#1f1f1f',
  color: '#fff',
  fontSize: '1rem'
};

const buttonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '0.5rem',
  background: 'linear-gradient(to right, #4f46e5, #6366f1)',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '0.5rem'
};

export default Login;
