import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTiers?: ('free' | 'plus' | 'pro')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedTiers }) => {
  const { user, loading } = useAuth();

  if (loading) {
    console.log('🔄 Waiting for auth state...');
    return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</p>;
  }

  console.log('👤 Auth Checked:', user);

  if (!user) {
    console.warn('🚫 Not logged in — redirecting to login');
    return <Navigate to="/login" replace />;
  }

if (allowedTiers && user?.tier && !allowedTiers.includes(user.tier as 'free' | 'plus' | 'pro')) {
  console.warn(`🚫 User with tier "${user.tier}" not allowed. Must be: ${allowedTiers.join(', ')}`);
  return <Navigate to="/select-plan" replace />;
}

  return children;
};

export default ProtectedRoute;
