import React, { createContext, useContext, useEffect, useState } from 'react';
import { gasService } from '../services/gasService';
import { toast } from 'sonner';

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
        const parsedUser = JSON.parse(savedUser);
        
        // Check if session has expired prior to this load
        const lastActive = localStorage.getItem('last_activity');
        if (lastActive) {
          const now = Date.now();
          const inactiveTime = now - parseInt(lastActive, 10);
          if (inactiveTime > 30 * 60 * 1000) {
            localStorage.removeItem('inventory_session');
            localStorage.removeItem('last_activity');
            setTimeout(() => {
              toast.error('Sesi Berakhir', {
                description: 'Anda telah otomatis keluar karena tidak aktif selama 30 menit.',
              });
            }, 800);
          } else {
            setUser(parsedUser);
          }
        } else {
          setUser(parsedUser);
        }
      } catch (e) {
        localStorage.removeItem('inventory_session');
      }
    }
    setLoading(false);
  }, []);

  // Effect to handle inactivity auto-logout after 30 minutes
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('last_activity');
      return;
    }

    // Initialize activity tracking
    localStorage.setItem('last_activity', Date.now().toString());

    let lastWriteTime = Date.now();

    const updateActivity = () => {
      const now = Date.now();
      // Throttle localStorage updates to once every 5 seconds for efficiency
      if (now - lastWriteTime > 5000) {
        localStorage.setItem('last_activity', now.toString());
        lastWriteTime = now;
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    const interval = setInterval(() => {
      const lastActiveStr = localStorage.getItem('last_activity');
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        const now = Date.now();
        const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes in ms

        if (now - lastActive > INACTIVITY_LIMIT) {
          logout();
          toast.error('Sesi Berakhir', {
            description: 'Anda telah otomatis keluar karena tidak aktif selama 30 menit.',
            duration: 8000,
          });
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await gasService.login({ email, password });
      if (response.success && response.user) {
        const userProfile = response.user;
        setUser(userProfile);
        localStorage.setItem('inventory_session', JSON.stringify(userProfile));
        localStorage.setItem('last_activity', Date.now().toString());
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
    localStorage.removeItem('last_activity');
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
