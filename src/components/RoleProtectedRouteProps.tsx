// ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTiers?: string[]; // ✅ Add this line
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedTiers }) => {
  const auth = useAuth();
  if (!auth || auth.loading) return <p>Loading auth...</p>;
  const { user } = auth;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Tier check logic
  if (allowedTiers && (!user.tier || !allowedTiers.includes(user.tier))) {

    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
