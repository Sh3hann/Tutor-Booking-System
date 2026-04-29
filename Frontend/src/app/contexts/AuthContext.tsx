import { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, getStoredToken } from '../utils/authService';

interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user from localStorage
    const storedUser = getStoredUser();
    const token = getStoredToken();
    
    if (storedUser && token) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user && !!getStoredToken(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
