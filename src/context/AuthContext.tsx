import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  plan: 'free' | 'basic' | 'pro';
  tier?: string; // optional depending on your schema
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
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

    const tryHydrateUser = async (attempts = 3) => {
      for (let i = 0; i < attempts; i++) {
        try {
          const storedUser = localStorage.getItem('justicepath-user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.id && parsed.email && isMounted) {
              setUser(parsed);
              console.log(`✅ Loaded user from localStorage (attempt ${i + 1})`);
              break;
            }
          }
        } catch (err) {
          console.error(`❌ Hydration failed on attempt ${i + 1}`, err);
        }
        await delay(200);
      }
      if (isMounted) setLoading(false);
    };

    tryHydrateUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      const userFromDb = data.user;

      if (!userFromDb || !userFromDb.id) {
        throw new Error('User data incomplete');
      }

      localStorage.setItem('justicepath-user', JSON.stringify(userFromDb));
      setUser(userFromDb);
      console.log('✅ Logged in and stored user:', userFromDb);
    } catch (err) {
      console.error('❌ Login failed:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('justicepath-user');
    setUser(null);
    console.log('👋 Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
