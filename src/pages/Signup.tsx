import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear prior messages
    setError('');
    setSuccess('');

    // Basic validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Simulate signup (save to localStorage)
    const user = { fullName, email, password };
    localStorage.setItem('justicepath-user', JSON.stringify(user));

    setSuccess('Signup successful! Redirecting to login...');
    setTimeout(() => navigate('/login'), 2000);
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
      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#111827',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '400px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Sign Up</h2>

        {error && <p style={{ color: 'salmon' }}>{error}</p>}
        {success && <p style={{ color: 'lightgreen' }}>{success}</p>}

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={inputStyle}
        />
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle}>Create Account</button>
        <p style={{ fontSize: '0.85rem', textAlign: 'center', color: '#888' }}>
          Already have an account? <a href="/login" style={{ color: '#6366f1' }}>Login</a>
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

export default Signup;
