import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  tier: 'free' | 'plus' | 'pro';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility sleep function
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
            if (isMounted) {
              setUser(parsed);
              console.log(`✅ User loaded on attempt ${i + 1}:`, parsed);
              break;
            }
          } else {
            console.warn(`⏳ Attempt ${i + 1}: No user found`);
          }
        } catch (err) {
          console.error(`❌ Attempt ${i + 1} failed`, err);
        }
        await delay(200); // wait before next attempt
      }

      if (isMounted) setLoading(false);
    };

    tryHydrateUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const mockUser: User = {
      id: '1',
      email,
      fullName: 'Test User',
      tier: 'plus', // ⬅️ update to test access control
    };
    localStorage.setItem('justicepath-user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('justicepath-user');
    setUser(null);
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
