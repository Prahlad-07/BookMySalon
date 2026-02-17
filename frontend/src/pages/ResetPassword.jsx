/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import api from '../config/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const tokenFromUrl = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();

    if (!token.trim()) {
      setError('Reset token is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      const response = await api.post('/api/auth/reset-password', {
        token: token.trim(),
        newPassword,
      });
      setMessage(response || 'Password reset successful.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md card-base p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Reset Password</h1>
        <p className="text-slate-600 mt-2">Enter your token and set a new password.</p>

        {message && <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</div>}
        {error && <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <form onSubmit={submit} className="space-y-4 mt-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">Reset Token</label>
            <input className="input-field mt-1.5" value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">New Password</label>
            <div className="relative mt-1.5">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field input-with-icon pr-11"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field mt-1.5"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>

        <p className="text-slate-600 text-sm mt-6 text-center">
          Back to <Link to="/login" className="text-blue-700 hover:text-blue-800 font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
