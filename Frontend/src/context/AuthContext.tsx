import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { MobileStorage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: Role) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  requestOtp: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyOtpAndReset: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'stocksense_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user has an active session from an explicit login
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
          MobileStorage.setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.error('Error reading session', e);
    }
  }, []);

  const login = async (email: string, role: Role = 'MANAGER'): Promise<boolean> => {
    const db = await MobileStorage.getDB();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    let targetUser: User;
    if (existing) {
      targetUser = { ...existing, role: role || existing.role };
    } else {
      targetUser = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: role,
        created_at: new Date().toISOString(),
      };
    }

    setUser(targetUser);
    await MobileStorage.setCurrentUser(targetUser);

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(targetUser));
      }
    } catch {}

    return true;
  };

  const logout = async () => {
    setUser(null);
    try {
      if (typeof window !== 'undefined') {
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(SESSION_KEY);
        }
        window.location.hash = '#login';
      }
    } catch {}
  };

  const switchRole = async (newRole: Role) => {
    if (!user) return;
    const updated: User = { ...user, role: newRole };
    setUser(updated);
    await MobileStorage.setCurrentUser(updated);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      }
    } catch {}
  };

  const requestOtp = async (email: string) => {
    const mockOtp = '849201';
    console.log(`[StockSense Auth] OTP sent to ${email}: ${mockOtp}`);
    return {
      success: true,
      message: `OTP sent to ${email}. Code: ${mockOtp}`,
      otp: mockOtp,
    };
  };

  const verifyOtpAndReset = async (_email: string, otp: string) => {
    if (otp === '849201' || otp.length === 6) {
      return { success: true, message: 'Password has been updated successfully.' };
    }
    return { success: false, message: 'Invalid OTP code. Please enter 6-digit code.' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
        requestOtp,
        verifyOtpAndReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
