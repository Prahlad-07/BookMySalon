/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import api from '../config/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError('');
      const response = await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      setMessage(response || 'If the email exists, a password reset link has been sent.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to process request right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md card-base rounded-3xl p-8">
        <h1 className="text-3xl font-bold text-slate-900">Forgot Password</h1>
        <p className="text-slate-600 mt-2">Enter your account email and we will send reset instructions.</p>

        {message && <div className="notice-box notice-success mt-5">{message}</div>}
        {error && <div className="notice-box notice-error mt-5">{error}</div>}

        <form onSubmit={submit} className="space-y-4 mt-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <div className="relative mt-1.5">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                className="input-field input-with-icon"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-slate-600 text-sm mt-6 text-center">
          Back to{' '}
          <Link to="/login" className="text-blue-700 hover:text-blue-800 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
