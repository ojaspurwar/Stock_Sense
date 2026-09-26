import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Layers, Shield, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { success } = useNotification();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || 'sarah.connor@stocksense.io', 'MANAGER');
    success('Welcome Back!', 'Signed into StockSense Inventory Management System.');
    navigate('/');
  };

  const handleQuickDemoLogin = (role: 'MANAGER' | 'STAFF') => {
    if (role === 'MANAGER') {
      login('sarah.connor@stocksense.io', 'MANAGER');
      success('Logged In as Manager', 'Role: Full Access (Inventory Manager)');
    } else {
      login('john.doe@stocksense.io', 'STAFF');
      success('Logged In as Staff', 'Role: Warehouse Staff');
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-md shadow-indigo-200 mb-4">
          <Layers className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to StockSense
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Modular Inventory Management System & Real-Time Stock Ledger
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah.connor@stocksense.io"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Forgot password (OTP)?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Quick 1-Click Demo Profiles
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('MANAGER')}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold flex flex-col items-center justify-center transition-colors"
              >
                <Shield className="w-4 h-4 text-indigo-600 mb-1" />
                <span>Sarah (Manager)</span>
                <span className="text-[10px] text-indigo-600 font-normal">Full Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('STAFF')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex flex-col items-center justify-center transition-colors"
              >
                <UserCheck className="w-4 h-4 text-slate-600 mb-1" />
                <span>John (Staff)</span>
                <span className="text-[10px] text-slate-500 font-normal">Warehouse Floor</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-800">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
