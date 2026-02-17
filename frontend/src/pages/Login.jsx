/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setIsLoading(true);
    const success = await login(identifier.trim(), password);
    setIsLoading(false);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hidden lg:flex glass-effect rounded-3xl p-10 flex-col justify-between">
          <div>
            <p className="badge-primary">Welcome Back</p>
            <h2 className="text-4xl font-extrabold mt-5 text-slate-900 leading-tight">
              Continue managing bookings and salon experience.
            </h2>
            <p className="text-slate-600 mt-4 leading-7">
              Sign in to access your personalized dashboard and workflow.
            </p>
          </div>
          <div className="h-48 rounded-2xl bg-gradient-to-br from-blue-100 via-cyan-100 to-indigo-100 flex items-center justify-center text-7xl">
            ✨
          </div>
        </div>

        <div className="card-base p-8 sm:p-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Sign In</h1>
          <p className="text-slate-600 mt-2">Access your BookMySalon account.</p>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-300 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-7">
            <div>
              <label className="text-sm font-semibold text-slate-700">Email or Username</label>
              <div className="relative mt-1.5">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field input-with-icon" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <div className="relative mt-1.5">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-field input-with-icon pr-11"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm text-blue-700 hover:text-blue-800 font-semibold">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-slate-600 text-sm mt-6">
            No account? <Link to="/signup" className="text-blue-700 hover:text-blue-800 font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
