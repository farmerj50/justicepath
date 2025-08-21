import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedTiers?: ('free' | 'plus' | 'pro')[];
}

const API_URL = import.meta.env.VITE_API_URL;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedTiers }) => {
  const { user, loading, setUser } = useAuth();
  const [checking, setChecking] = useState(false);

  // Try to silently refresh if we don't have a user yet or token is stale
  useEffect(() => {
    let cancelled = false;

    const ensureSession = async () => {
      if (loading) return;             // wait for AuthContext boot
      if (user) return;                // already authenticated in context
      setChecking(true);

      try {
        // 1) Ask backend to refresh using the HttpOnly cookie
        const r = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',      // send jp_rt cookie
        });

        if (r.ok) {
          const data = await r.json(); // { token: "<access>" }
          const token: string | undefined = data?.token;
          if (token) {
            // 2) Store access token so apiClient uses it
            localStorage.setItem('justicepath-token', token);

            // 3) Hydrate user into context (so existing UI logic keeps working)
            const me = await fetch(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              credentials: 'include',
            });
            if (me.ok) {
              const profile = await me.json();
              if (!cancelled) setUser(profile);
            }
          }
        }
      } catch {
        // ignore; we'll fall through to normal redirect
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    ensureSession();
    return () => { cancelled = true; };
  }, [API_URL, loading, user, setUser]);

  if (loading || checking) {
    // keep it simple; prevents protected pages firing requests with no token
    return <p style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</p>;
  }

  if (!user) {
    // still no session after refresh attempt
    return <Navigate to="/login" replace />;
  }

  // Optional plan/tier gate (unchanged)
  if (
    allowedTiers &&
    user?.plan &&
    !allowedTiers.includes(user.plan as 'free' | 'plus' | 'pro')
  ) {
    return <Navigate to="/select-plan" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
