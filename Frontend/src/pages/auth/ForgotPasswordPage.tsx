import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Layers, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [simulatedOtp, setSimulatedOtp] = useState<string>('');

  const { requestOtp, verifyOtpAndReset } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Input Required', 'Please enter your account email.');
      return;
    }
    const res = await requestOtp(email);
    if (res.success) {
      setSimulatedOtp(res.otp || '849201');
      setStep('verify');
      success('OTP Sent', res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await verifyOtpAndReset(email, otp);
    if (res.success) {
      success('Password Reset Successful', 'You can now sign in with your new password.');
      navigate('/login');
    } else {
      error('Verification Failed', res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center text-white shadow-md shadow-indigo-200 mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Password with OTP
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {step === 'request'
            ? 'Enter your email to receive a secure one-time passcode'
            : 'Enter the 6-digit OTP code sent to your email'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10 space-y-6">
          {step === 'request' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Account Email
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

              <button
                type="submit"
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <span>Send One-Time Passcode</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                <span className="font-semibold block">Demo OTP Passcode:</span>
                <span className="font-mono text-sm font-bold text-indigo-700">{simulatedOtp}</span>
                <p className="text-[11px] text-indigo-600 mt-1">
                  Code sent to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="849201"
                  className="w-full text-center tracking-widest font-mono text-lg py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify OTP & Update Password</span>
              </button>
            </form>
          )}

          <div className="text-center text-xs text-slate-500">
            Remembered your credentials?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-800">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
