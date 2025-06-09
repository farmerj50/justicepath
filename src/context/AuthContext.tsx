import React, { createContext, useContext, useState, useEffect } from 'react';

export type User = {
  id: string;
  email: string;
  fullName: string;
  plan: 'free' | 'basic' | 'pro' | null;
  tier?: 'FREE' | 'PLUS' | 'PRO';
};

export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const tryHydrateUser = async () => {
      if (localStorage.getItem('skip-hydration-check')) {
        console.log('🛑 Skipping hydration after signup');
        localStorage.removeItem('skip-hydration-check');
        setLoading(false);
        return;
      }

      const storedUser = localStorage.getItem('justicepath-user');
      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        if (!parsed?.id) throw new Error('Missing ID in stored user');

        const res = await fetch('http://localhost:5000/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${parsed.token ?? ''}`,
          },
        });

        if (!res.ok) throw new Error('User not found');
        const data = await res.json();

        if (!data?.plan && window.location.pathname !== '/select-plan') {
          console.warn('🛑 No plan detected, redirecting to /select-plan');
          if (isMounted) setUser(null);
          window.location.href = '/select-plan';
          return;
        }

        if (isMounted) {
          setUser(data);
          console.log('✅ Valid user restored from DB:', data);
        }

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        const stack = err instanceof Error ? err.stack : '';
        console.warn('⚠️ Invalid stored user, clearing:', message, stack);
        localStorage.removeItem('justicepath-user');
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    tryHydrateUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Invalid credentials');

      const data = await res.json();
      const userFromDb = data.user;

      if (!userFromDb || !userFromDb.id) throw new Error('User data incomplete');

      localStorage.setItem('justicepath-user', JSON.stringify(userFromDb));
      setUser(userFromDb);
      console.log('✅ Logged in and stored user:', userFromDb);

      return userFromDb;
    } catch (err) {
      console.error('❌ Login failed:', err);
      throw err;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!res.ok) throw new Error('Registration failed');

      const data = await res.json();
      const newUser = data.user;

      if (!newUser || !newUser.id) throw new Error('Incomplete user returned');

      localStorage.setItem('justicepath-user', JSON.stringify(newUser));
      localStorage.setItem('skip-hydration-check', 'true');
      setUser(newUser);

      console.log('✅ Registered and logged in user:', newUser);

      window.location.href = '/select-plan';
    } catch (err) {
      console.error('❌ Registration error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('justicepath-user');
    setUser(null);
    console.log('👋 Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
