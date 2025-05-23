// ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/Temp';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTiers?: string[]; // ✅ Add this line
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedTiers }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Tier check logic
  if (allowedTiers && !allowedTiers.includes(user.tier)) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
