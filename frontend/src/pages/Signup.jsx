/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-13
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_AUTH_URL } from '../config/apiBaseUrl';
import { getDashboardPathByRole } from '../utils/roleRouting';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { Field, Notice } from '../components/ui';

const ENABLE_GOOGLE_OAUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true';

const ROLES = [
  { value: 'CUSTOMER', title: 'I’m booking appointments', body: 'Discover salons, book and manage visits.' },
  { value: 'SALON_OWNER', title: 'I run a salon', body: 'Publish your menu and manage your calendar.' },
];

const strengthOf = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
};
const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

export default function Signup() {
  const navigate = useNavigate();
  const { signup, error: authError, user, loading, clearError } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'CUSTOMER' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [touched, setTouched] = useState({});

  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && user) navigate(getDashboardPathByRole(user.role), { replace: true });
  }, [loading, user, navigate]);

  const strength = useMemo(() => strengthOf(form.password), [form.password]);

  const fieldErrors = {
    name: !form.name.trim() ? 'Tell us your name.' : '',
    email: !/^\S+@\S+\.\S+$/.test(form.email.trim()) ? 'Enter a valid email address.' : '',
    password: form.password.length < 8 ? 'Use at least 8 characters.' : '',
    confirmPassword: form.confirmPassword !== form.password ? 'Passwords don’t match.' : '',
  };
  const hasErrors = Object.values(fieldErrors).some(Boolean);

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setLocalError('');
  };
  const blur = (key) => () => setTouched((prev) => ({ ...prev, [key]: true }));
  const errorFor = (key) => (touched[key] ? fieldErrors[key] : '');

  const submit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (hasErrors) return;

    setSubmitting(true);
    const result = await signup(form);
    setSubmitting(false);

    if (!result?.ok) {
      if (result?.code === 'EMAIL_EXISTS') {
        const email = encodeURIComponent(form.email.trim().toLowerCase());
        const message = encodeURIComponent('You already have an account with that email. Sign in instead.');
        navigate(`/login?email=${email}&error=${message}`);
      } else {
        setLocalError(result?.error || 'We couldn’t create your account. Please try again.');
      }
      return;
    }
    navigate(getDashboardPathByRole(result.user.role), { replace: true });
  };

  const error = localError || authError;

  return (
    <AuthLayout
      eyebrow="Create your account"
      title="Join BookMySalon"
      description="One account for booking appointments or running your salon. It takes under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="label">How will you use BookMySalon?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLES.map((role) => {
              const active = form.role === role.value;
              return (
                <label
                  key={role.value}
                  className={`cursor-pointer rounded-md border p-3.5 transition ${
                    active ? 'border-ink bg-surface ring-1 ring-ink' : 'border-line-strong hover:border-ink/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={active}
                    onChange={update('role')}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-ink">{role.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{role.body}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field label="Full name" htmlFor="su-name" error={errorFor('name')}>
          <input
            id="su-name"
            className="field"
            value={form.name}
            onChange={update('name')}
            onBlur={blur('name')}
            autoComplete="name"
          />
        </Field>

        <Field label="Email" htmlFor="su-email" error={errorFor('email')}>
          <input
            id="su-email"
            type="email"
            className="field"
            value={form.email}
            onChange={update('email')}
            onBlur={blur('email')}
            autoComplete="email"
          />
        </Field>

        <div>
          <label htmlFor="su-password" className="label">
            Password
          </label>
          <div className="relative">
            <input
              id="su-password"
              type={showPassword ? 'text' : 'password'}
              className="field pr-11"
              value={form.password}
              onChange={update('password')}
              onBlur={blur('password')}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < strength ? (strength <= 1 ? 'bg-danger' : strength === 2 ? 'bg-warning' : 'bg-success') : 'bg-line'
                    }`}
                  />
                ))}
              </div>
              <span className="w-16 text-right text-[12px] text-ink-3">{STRENGTH_LABEL[strength]}</span>
            </div>
          )}
          {errorFor('password') && <p className="field-error">{errorFor('password')}</p>}
        </div>

        <Field label="Confirm password" htmlFor="su-confirm" error={errorFor('confirmPassword')}>
          <input
            id="su-confirm"
            type={showPassword ? 'text' : 'password'}
            className="field"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            onBlur={blur('confirmPassword')}
            autoComplete="new-password"
          />
        </Field>

        <button type="submit" className="btn-dark btn-lg w-full" disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      {ENABLE_GOOGLE_OAUTH && (
        <>
          <div className="my-6 flex items-center gap-4 text-xs text-ink-3">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton href={GOOGLE_AUTH_URL} label="Sign up with Google" />
        </>
      )}
    </AuthLayout>
  );
}
