import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  const savedUserRaw = localStorage.getItem('justicepath-user');

  if (!savedUserRaw) {
    setError('No user found. Please sign up first.');
    return;
  }

  try {
    const savedUser = JSON.parse(savedUserRaw);

    if (!savedUser?.email || !savedUser?.password) {
      setError('Corrupted user data. Please sign up again.');
      return;
    }

    if (email !== savedUser.email || password !== savedUser.password) {
      setError('Invalid email or password.');
      return;
    }

    // ✅ Successful login
    localStorage.setItem('justicepath-auth', 'true');
    localStorage.setItem('justicepath-user', JSON.stringify(savedUser));

    // Route based on whether a plan is already set
    if (!savedUser.plan) {
      navigate('/select-plan');
    } else {
      navigate('/dashboard');
    }

  } catch (err) {
    console.error('Login parse error:', err);
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
