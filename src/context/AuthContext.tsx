import React, { createContext, useContext, useEffect, useState } from 'react';
import { gasService } from '../services/gasService';

export type UserRole = 'ADMIN' | 'GUDANG' | 'UNIT' | 'DIREKTUR' | 'STAFF' | 'USER';

interface UserProfile {
  email: string;
  name: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isGudang: boolean;
  isUnit: boolean;
  isDirektur: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('inventory_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('inventory_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await gasService.login({ email, password });
      if (response.success && response.user) {
        const userProfile = response.user;
        setUser(userProfile);
        localStorage.setItem('inventory_session', JSON.stringify(userProfile));
      } else {
        throw new Error(response.error || 'Login gagal. Periksa kembali email dan password.');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('inventory_session');
  };

  const getRole = () => user?.role?.toUpperCase() || 'GUEST';

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAdmin: getRole() === 'ADMIN',
    isGudang: getRole() === 'GUDANG' || getRole() === 'ADMIN',
    isUnit: getRole() === 'UNIT' || getRole() === 'GUDANG' || getRole() === 'ADMIN' || getRole() === 'STAFF' || getRole() === 'USER',
    isDirektur: getRole() === 'DIREKTUR' || getRole() === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
