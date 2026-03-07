/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/brand-logo.png';
import { getDashboardPathByRole } from '../utils/roleRouting';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bookmysalon-5.onrender.com';
const GOOGLE_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;
const ENABLE_GOOGLE_OAUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true';

const ACCOUNT_ROLES = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    subtitle: 'Book and manage appointments',
  },
  {
    value: 'SALON_OWNER',
    label: 'Salon Owner',
    subtitle: 'Create salons and manage operations',
  },
];

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const { signup, error: authError, user, loading } = useAuth();
  const navigate = useNavigate();

  const error = localError || authError;

  useEffect(() => {
    if (loading || !user) return;
    navigate(getDashboardPathByRole(user.role), { replace: true });
  }, [loading, user, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
    setLocalError('');
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!['CUSTOMER', 'SALON_OWNER'].includes(formData.role)) {
      setLocalError('Please select a valid account type.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await signup(formData);
    setIsLoading(false);

    if (!result?.ok) {
      if (result?.code === 'EMAIL_EXISTS') {
        const email = encodeURIComponent(formData.email.trim().toLowerCase());
        const message = encodeURIComponent('Account already exists. Please sign in.');
        navigate(`/login?email=${email}&error=${message}`);
      }
      return;
    }

    navigate(getDashboardPathByRole(result.user.role), { replace: true });
  };

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-3xl card-base rounded-3xl p-8 sm:p-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="login-brand-wrap mb-4">
              <img src={brandLogo} alt="BookMySalon logo" className="signup-brand-logo" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
            <p className="text-slate-600 mt-2">Choose role, add your details, and get started instantly.</p>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 items-center justify-center text-primary-700">
            <Sparkles size={20} />
          </div>
        </div>

        {error && (
          <div className="notice-box notice-error mb-5 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACCOUNT_ROLES.map((roleOption) => {
              const isSelected = formData.role === roleOption.value;
              return (
                <label
                  key={roleOption.value}
                  className={`cursor-pointer rounded-xl border px-3 py-3 transition ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption.value}
                    checked={isSelected}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <p className="text-sm font-semibold text-slate-900">{roleOption.label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{roleOption.subtitle}</p>
                </label>
              );
            })}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Full Name</label>
            <div className="relative mt-1.5">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input-field input-with-icon"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <div className="relative mt-1.5">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input-field input-with-icon"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative mt-1.5">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-field input-with-icon pr-11"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
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
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <div className="relative mt-1.5">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-field input-with-icon pr-11"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full inline-flex items-center justify-center gap-2" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
            {!isLoading && <ArrowRight size={16} />}
          </button>
        </form>

        {ENABLE_GOOGLE_OAUTH && (
          <div className="mt-5">
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

        <p className="text-slate-600 text-sm mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-700 hover:text-blue-800 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
