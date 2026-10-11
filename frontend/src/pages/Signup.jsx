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
import { useT } from '../i18n';

const ENABLE_GOOGLE_OAUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true';

const ROLES = [
  { value: 'CUSTOMER', title: 'signup.roleCustomer', body: 'signup.roleCustomerBody' },
  { value: 'SALON_OWNER', title: 'signup.roleOwner', body: 'signup.roleOwnerBody' },
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
const STRENGTH_LABEL = ['signup.strength0', 'signup.strength1', 'signup.strength2', 'signup.strength3', 'signup.strength4'];

export default function Signup() {
  const navigate = useNavigate();
  const { signup, error: authError, user, loading, clearError } = useAuth();
  const t = useT();

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
    name: !form.name.trim() ? t('signup.err.name') : '',
    email: !/^\S+@\S+\.\S+$/.test(form.email.trim()) ? t('signup.err.email') : '',
    password: form.password.length < 8 ? t('auth.err.min8') : '',
    confirmPassword: form.confirmPassword !== form.password ? t('auth.err.mismatch') : '',
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
        navigate(`/login?email=${email}&notice=exists`);
      } else {
        setLocalError(result?.error || t('auth.err.signup'));
      }
      return;
    }
    navigate(getDashboardPathByRole(result.user.role), { replace: true });
  };

  const error = localError || authError;

  return (
    <AuthLayout
      eyebrow={t('signup.eyebrow')}
      title={t('signup.title')}
      description={t('signup.description')}
      footer={
        <>
          {t('signup.haveAccount')}{' '}
          <Link to="/login" className="link">
            {t('nav.signIn')}
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
          <legend className="label">{t('signup.roleQuestion')}</legend>
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
                  <span className="block text-sm font-semibold text-ink">{t(role.title)}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{t(role.body)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field label={t('auth.fullName')} htmlFor="su-name" error={errorFor('name')}>
          <input
            id="su-name"
            className="field"
            value={form.name}
            onChange={update('name')}
            onBlur={blur('name')}
            autoComplete="name"
          />
        </Field>

        <Field label={t('auth.email')} htmlFor="su-email" error={errorFor('email')}>
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
            {t('auth.password')}
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
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
              <span className="min-w-[4rem] text-right text-[12px] text-ink-3">{t(STRENGTH_LABEL[strength])}</span>
            </div>
          )}
          {errorFor('password') && <p className="field-error">{errorFor('password')}</p>}
        </div>

        <Field label={t('auth.confirmPassword')} htmlFor="su-confirm" error={errorFor('confirmPassword')}>
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
          {submitting ? t('signup.creating') : t('signup.submit')}
        </button>
      </form>

      {ENABLE_GOOGLE_OAUTH && (
        <>
          <div className="my-6 flex items-center gap-4 text-xs text-ink-3">
            <span className="h-px flex-1 bg-line" />
            {t('common.or')}
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton href={GOOGLE_AUTH_URL} label={t('auth.googleSignup')} />
        </>
      )}
    </AuthLayout>
  );
}
