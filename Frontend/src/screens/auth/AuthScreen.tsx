import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StockCube, StockCubeHandle } from './StockCube';
import { StockCubeEvent } from '../../lib/stockCube';
import { GlassCard } from '../../components/ui/GlassCard';
import { Role } from '../../types';

export type AuthMode = 'login' | 'signup' | 'otp';

export interface AuthScreenProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

const CAROUSEL_EVENTS: StockCubeEvent[] = ['receipt', 'delivery', 'transfer', 'adjustment'];

const OPERATION_SLIDES = [
  {
    title: 'Receipts',
    description: 'Goods arrive from a vendor. You validate, and stock goes up on its own.',
  },
  {
    title: 'Delivery orders',
    description: 'Pick, pack, validate. Stock goes down the moment it ships.',
  },
  {
    title: 'Internal transfers',
    description: 'Move stock between warehouses and racks. Every move is logged.',
  },
  {
    title: 'Adjustments',
    description: 'Enter what you counted. The system fixes the difference and records why.',
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  onSuccess,
}) => {
  const { login, requestOtp, verifyOtpAndReset } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form states
  const [email, setEmail] = useState('arjun@kapoorsteel.in');
  const [password, setPassword] = useState('••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('Arjun Kapoor');
  const [role, setRole] = useState<Role>('MANAGER');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // OTP states
  const [otpStep, setOtpStep] = useState<1 | 2 | 3>(2);
  const [otpValues, setOtpValues] = useState<string[]>(['4', '8', '1', '9', '', '']);
  const [resendTimer, setResendTimer] = useState(42);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Stock Cube & Carousel state
  const cubeRef = useRef<StockCubeHandle | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const prevModeRef = useRef(mode);

  // Initial trigger for slide 1 on mount so crate drops in straight away
  useEffect(() => {
    if (mode !== 'otp') {
      const timer = setTimeout(() => {
        cubeRef.current?.play('receipt');
      }, 60);
      return () => clearTimeout(timer);
    }
  }, []);

  // When returning from OTP mode back to login/signup, resume cube animation on current slide
  useEffect(() => {
    if (prevModeRef.current === 'otp' && mode !== 'otp') {
      cubeRef.current?.play(CAROUSEL_EVENTS[carouselIndex]);
    }
    prevModeRef.current = mode;
  }, [mode, carouselIndex]);

  const handleSlideChange = (newIndex: number) => {
    setCarouselIndex(newIndex);
    cubeRef.current?.play(CAROUSEL_EVENTS[newIndex]);
  };

  // Auto timer for OTP countdown
  useEffect(() => {
    if (mode !== 'otp' || resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [mode, resendTimer]);

  // Sync auth mode with URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncHash = () => {
      const h = window.location.hash.replace('#', '').toLowerCase();
      if (h === 'signup') {
        setMode('signup');
      } else if (h === 'otp') {
        setMode('otp');
        setOtpStep(2);
      } else if (h === 'login') {
        setMode('login');
      }
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const ok = await login(email, role);
      if (ok) {
        if (typeof window !== 'undefined') {
          window.location.hash = '#dashboard';
        }
        onSuccess?.();
      } else {
        setErrorMsg('Invalid login details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error logging in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const ok = await login(email, role);
      if (ok) {
        if (typeof window !== 'undefined') {
          window.location.hash = '#dashboard';
        }
        onSuccess?.();
      } else {
        setErrorMsg('Error creating account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpInput = (index: number, val: string) => {
    const char = val.slice(-1);
    const updated = [...otpValues];
    updated[index] = char;
    setOtpValues(updated);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      const chars = pasted.split('');
      const updated = [...otpValues];
      chars.forEach((c, idx) => {
        if (idx < 6) updated[idx] = c;
      });
      setOtpValues(updated);
      otpInputRefs.current[Math.min(5, chars.length)]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpValues.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of the code.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    const res = await verifyOtpAndReset(email, code);
    setIsSubmitting(false);
    if (res.success) {
      setOtpStep(3);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setMode('login');
    setErrorMsg(null);
  };

  return (
    <div className="auth">
      {/* Logo Tile */}
      <div className="logo-tile" onClick={() => setMode('login')}>
        <span className="logo">stocksense.</span>
        <span className="logo-mark" aria-hidden="true">
          <i></i>
          <i className="o"></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i className="o"></i>
          <i></i>
        </span>
      </div>

      {/* Top Glass Bar */}
      <div className="bar">
        <span>Inventory for warehouses and factories</span>
        {mode === 'login' && (
          <button className="btn-white" onClick={() => setMode('signup')}>
            Create account
          </button>
        )}
        {mode === 'signup' && (
          <button className="btn-white" onClick={() => setMode('login')}>
            Log in
          </button>
        )}
        {mode === 'otp' && (
          <button className="btn-white" onClick={() => setMode('login')}>
            Back to log in
          </button>
        )}
      </div>

      {/* Left White Form Section */}
      <section className="auth-left">
        {mode === 'login' && (
          <div className="col">
            <div className="dots">
              <i></i>
              <i></i>
              <i></i>
            </div>
            <h1 className="headline">
              <span className="m">INVENTORY</span>
              <span className="s">without</span>
              <span className="m">GUESSWORK</span>
            </h1>
            <p className="lede">
              Receipts, deliveries, transfers and stock counts in one place. Updated the moment stock moves.
            </p>
            {errorMsg && (
              <div style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}
            <form className="form" onSubmit={handleLogin}>
              <div className="field">
                <label>Email</label>
                <div className="input">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Password</label>
                <div className="input focus">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="suffix"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </div>
              </div>
              <div className="row">
                <span
                  className="check"
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                >
                  <i style={{ background: keepLoggedIn ? 'var(--ink)' : 'transparent', color: keepLoggedIn ? '#fff' : 'transparent' }}>
                    ✓
                  </i>
                  Keep me logged in
                </span>
                <a
                  className="link"
                  style={{ fontSize: 13 }}
                  href="#otp"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('otp');
                    setOtpStep(2);
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <button
                type="submit"
                className="btn primary block"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </button>
            </form>
            <p className="alt">
              New to StockSense?{' '}
              <a
                className="link"
                style={{ fontSize: 13 }}
                href="#signup"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('signup');
                }}
              >
                Create an account
              </a>
            </p>
          </div>
        )}

        {mode === 'signup' && (
          <div className="col">
            <div className="dots">
              <i></i>
              <i></i>
              <i></i>
            </div>
            <h1 className="headline">
              <span className="m">SET UP</span>
              <span className="s">your</span>
              <span className="m">WAREHOUSE</span>
            </h1>
            <p className="lede">
              Create your account. You can add warehouses and products right after.
            </p>
            {errorMsg && (
              <div style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                {errorMsg}
              </div>
            )}
            <form className="form" onSubmit={handleSignup}>
              <div className="field">
                <label>Full name</label>
                <div className="input">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Work email</label>
                <div className="input">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>I am a</label>
                <div className="seg2">
                  <span
                    className={role === 'MANAGER' ? 'on' : ''}
                    onClick={() => setRole('MANAGER')}
                  >
                    Inventory manager
                  </span>
                  <span
                    className={role === 'STAFF' ? 'on' : ''}
                    onClick={() => setRole('STAFF')}
                  >
                    Warehouse staff
                  </span>
                </div>
              </div>
              <div className="field">
                <label>Password</label>
                <div className="input focus">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="suffix">8+ characters</span>
                </div>
              </div>
              <button
                type="submit"
                className="btn primary block"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>
            <p className="alt">
              Already have an account?{' '}
              <a
                className="link"
                style={{ fontSize: 13 }}
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('login');
                }}
              >
                Log in
              </a>
            </p>
          </div>
        )}

        {mode === 'otp' && (
          <div className="col">
            <div className="steps">
              <span className={otpStep > 1 ? 'done' : 'now'}>
                <b>{otpStep > 1 ? '✓' : '1'}</b>Email
              </span>
              <span className="line"></span>
              <span className={otpStep === 2 ? 'now' : otpStep > 2 ? 'done' : ''}>
                <b>{otpStep > 2 ? '✓' : '2'}</b>Code
              </span>
              <span className="line"></span>
              <span className={otpStep === 3 ? 'now' : ''}>
                <b>3</b>New password
              </span>
            </div>

            {otpStep === 1 && (
              <>
                <h1 className="headline">
                  <span className="m">RESET</span>
                  <span className="s">your</span>
                  <span className="m">PASSWORD</span>
                </h1>
                <p className="lede">
                  Enter your email address and we will send a 6-digit OTP code to verify your account.
                </p>
                <form
                  className="form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await requestOtp(email);
                    setOtpStep(2);
                    setResendTimer(42);
                  }}
                >
                  <div className="field">
                    <label>Email</label>
                    <div className="input">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn primary block">
                    Send reset code
                  </button>
                </form>
              </>
            )}

            {otpStep === 2 && (
              <>
                <h1 className="headline">
                  <span className="m">CHECK</span>
                  <span className="s">your</span>
                  <span className="m">EMAIL</span>
                </h1>
                <p className="lede">
                  We sent a 6-digit code to {email}. Enter it below to reset your password.
                </p>
                {errorMsg && (
                  <div style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                    {errorMsg}
                  </div>
                )}
                <form className="form" onSubmit={handleVerifyOtp}>
                  <div className="otp" onPaste={handleOtpPaste}>
                    {otpValues.map((v, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpInputRefs.current[i] = el)}
                        type="text"
                        maxLength={1}
                        value={v}
                        onChange={(e) => handleOtpInput(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoFocus={i === 4}
                      />
                    ))}
                  </div>
                  <p className="hint">
                    {resendTimer > 0 ? (
                      <>
                        Resend code in <b>0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</b>
                      </>
                    ) : (
                      <span
                        className="link"
                        style={{ cursor: 'pointer' }}
                        onClick={async () => {
                          await requestOtp(email);
                          setResendTimer(42);
                        }}
                      >
                        Resend code now
                      </span>
                    )}
                  </p>
                  <button
                    type="submit"
                    className="btn primary block"
                    disabled={isSubmitting}
                  >
                    Verify code
                  </button>
                </form>
              </>
            )}

            {otpStep === 3 && (
              <>
                <h1 className="headline">
                  <span className="m">CREATE</span>
                  <span className="s">new</span>
                  <span className="m">PASSWORD</span>
                </h1>
                <p className="lede">
                  Your code has been verified. Choose a strong new password for your account.
                </p>
                {errorMsg && (
                  <div style={{ color: 'var(--coral)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                    {errorMsg}
                  </div>
                )}
                <form className="form" onSubmit={handleCompletePasswordReset}>
                  <div className="field">
                    <label>New password</label>
                    <div className="input focus">
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <span className="suffix">8+ characters</span>
                    </div>
                  </div>
                  <div className="field">
                    <label>Confirm new password</label>
                    <div className="input">
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn primary block">
                    Save new password
                  </button>
                </form>
              </>
            )}

            <p className="alt">
              <a
                className="link"
                style={{ fontSize: 13 }}
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('login');
                }}
              >
                Use a different email
              </a>
            </p>
          </div>
        )}
      </section>

      {/* Right Sky Section with ASCII Stock Cube & Glass Card */}
      <section className="auth-right">
        <StockCube ref={cubeRef} />

        {mode !== 'otp' ? (
          <GlassCard
            slides={OPERATION_SLIDES}
            currentIndex={carouselIndex}
            onIndexChange={handleSlideChange}
            style={{
              position: 'absolute',
              left: 18,
              bottom: 18,
              width: 320,
              zIndex: 2,
            }}
          />
        ) : (
          <div
            className="glass"
            style={{
              position: 'absolute',
              left: 18,
              bottom: 18,
              width: 300,
              zIndex: 2,
            }}
          >
            <div className="pix" aria-hidden="true">
              <i></i>
              <i className="off"></i>
              <i></i>
              <i className="off"></i>
              <i></i>
              <i className="off"></i>
              <i></i>
              <i className="off"></i>
              <i></i>
            </div>
            <h4>Secure reset</h4>
            <p>The code works for 10 minutes. We will never ask you to share it.</p>
          </div>
        )}
      </section>
    </div>
  );
};
