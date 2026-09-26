import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { MockStorage } from '../services/mockStorage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: Role) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
  requestOtp: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyOtpAndReset: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const current = MockStorage.getCurrentUser();
    setUser(current);
  }, []);

  const login = (email: string, role: Role = 'MANAGER'): boolean => {
    const existing = MockStorage.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setUser(existing);
      MockStorage.setCurrentUser(existing);
      return true;
    }
    // Create quick session user
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      role: role,
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    MockStorage.setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stocksense_current_user_v1');
  };

  const switchRole = (newRole: Role) => {
    if (!user) return;
    const updated: User = { ...user, role: newRole };
    setUser(updated);
    MockStorage.setCurrentUser(updated);
  };

  const requestOtp = async (email: string) => {
    // Simulated OTP generation
    const mockOtp = '849201';
    return {
      success: true,
      message: `OTP sent to ${email}. For demo testing, use code: ${mockOtp}`,
      otp: mockOtp,
    };
  };

  const verifyOtpAndReset = async (_email: string, otp: string) => {
    if (otp === '849201' || otp.length === 6) {
      return { success: true, message: 'Password has been successfully updated.' };
    }
    return { success: false, message: 'Invalid OTP code. Please enter the 6-digit code.' };
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
