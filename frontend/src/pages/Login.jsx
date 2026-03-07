/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/brand-logo.png';
import { getDashboardPathByRole } from '../utils/roleRouting';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bookmysalon-5.onrender.com';
const GOOGLE_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;
const ENABLE_GOOGLE_OAUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true';

const DEMO_USERS = [
  { label: 'Customer', email: 'customer.test@gmail.com', password: 'Test@12345' },
  { label: 'Salon Owner', email: 'owner.test@gmail.com', password: 'Test@12345' },
];

export default function Login() {
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, error, user, loading } = useAuth();
  const navigate = useNavigate();

  const loginMessage = searchParams.get('error');

  useEffect(() => {
    if (loading || !user) return;
    navigate(getDashboardPathByRole(user.role), { replace: true });
  }, [loading, user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier || !password) return;

    setIsLoading(true);
    const loggedInUser = await login(identifier.trim(), password);
    setIsLoading(false);

    if (!loggedInUser) return;
    navigate(getDashboardPathByRole(loggedInUser.role), { replace: true });
  };

  const renderedError = error || loginMessage;

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hidden lg:flex glass-effect rounded-3xl p-10 flex-col justify-between">
          <div>
            <span className="badge-primary inline-flex items-center gap-2">
              <Sparkles size={14} /> Welcome Back
            </span>
            <h1 className="text-4xl font-bold text-slate-900 mt-5 leading-tight">
              Manage bookings, messages, and salon activity from one dashboard.
            </h1>
            <p className="text-slate-600 mt-4 leading-7">
              Login as customer or owner and continue your workflow exactly where you left off.
            </p>
          </div>

          <div className="card-base p-6 bg-gradient-to-br from-blue-50/70 via-white to-teal-50/60">
            <p className="text-slate-700 font-semibold mb-3">Quick demo access</p>
            <div className="space-y-2">
              {DEMO_USERS.map((demoUser) => (
                <button
                  key={demoUser.email}
                  type="button"
                  onClick={() => {
                    setIdentifier(demoUser.email);
                    setPassword(demoUser.password);
                  }}
                  className="w-full text-left rounded-xl border border-slate-200 bg-white/80 px-3 py-2 hover:border-primary-200 hover:bg-primary-50/70"
                >
                  <p className="text-sm font-semibold text-slate-900">{demoUser.label}</p>
                  <p className="text-xs text-slate-600">{demoUser.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-base rounded-3xl p-8 sm:p-10">
          <div className="login-brand-wrap mb-5">
            <img src={brandLogo} alt="BookMySalon logo" className="login-brand-logo" />
          </div>

          <h2 className="text-3xl font-bold text-slate-900">Sign In</h2>
          <p className="text-slate-600 mt-2">Use your email or username to continue.</p>

          {renderedError && <div className="notice-box notice-error mt-5">{renderedError}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-semibold text-slate-700">Email or Username</label>
              <div className="relative mt-1.5">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-field input-with-icon"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative mt-1.5">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field input-with-icon pr-11"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm text-blue-700 hover:text-blue-800 font-semibold">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button className="btn-primary w-full inline-flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-5 lg:hidden card-base p-4 bg-gradient-to-br from-blue-50/70 via-white to-teal-50/60">
            <p className="text-sm font-semibold text-slate-800 mb-2">Demo credentials</p>
            <div className="space-y-2">
              {DEMO_USERS.map((demoUser) => (
                <button
                  key={demoUser.email}
                  type="button"
                  onClick={() => {
                    setIdentifier(demoUser.email);
                    setPassword(demoUser.password);
                  }}
                  className="w-full text-left rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-primary-200 hover:bg-primary-50"
                >
                  <span className="text-sm font-semibold text-slate-900">{demoUser.label}</span>
                  <span className="block text-xs text-slate-600">{demoUser.email}</span>
                </button>
              ))}
            </div>
          </div>

          {ENABLE_GOOGLE_OAUTH && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  window.location.href = GOOGLE_AUTH_URL;
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.653 32.657 29.233 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.849 1.154 7.971 3.029l5.657-5.657C34.053 6.053 29.279 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.849 1.154 7.971 3.029l5.657-5.657C34.053 6.053 29.279 4 24 4c-7.682 0-14.348 4.337-17.694 10.691z" />
                  <path fill="#4CAF50" d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.141 35.091 26.715 36 24 36c-5.213 0-9.62-3.33-11.283-7.946l-6.522 5.025C9.5 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.048 12.048 0 01-4.084 5.57l.003-.002 6.19 5.238C36.971 39.206 44 34 44 24c0-1.341-.138-2.651-.389-3.917z" />
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          <p className="text-slate-600 text-sm mt-6">
            No account?{' '}
            <Link to="/signup" className="text-blue-700 hover:text-blue-800 font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
