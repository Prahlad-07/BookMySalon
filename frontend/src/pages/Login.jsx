/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-13
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GOOGLE_AUTH_URL } from '../config/apiBaseUrl';
import { getDashboardPathByRole } from '../utils/roleRouting';
import AuthLayout from '../components/AuthLayout';
import { Field, Notice } from '../components/ui';
import GoogleButton from '../components/GoogleButton';
import { useT } from '../i18n';

const ENABLE_GOOGLE_OAUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true';
const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';

const DEMO_USERS = [
  { key: 'customer', label: 'role.CUSTOMER', email: 'customer.test@gmail.com' },
  { key: 'owner', label: 'role.SALON_OWNER', email: 'owner.test@gmail.com' },
  { key: 'admin', label: 'login.demoAdmin', email: 'admin.test@gmail.com' },
];
const DEMO_PASSWORD = 'Test@12345';

export default function Login() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, error, user, loading, clearError } = useAuth();
  const t = useT();

  const [identifier, setIdentifier] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoPending, setDemoPending] = useState('');

  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redirectNotice =
    searchParams.get('notice') === 'exists' ? t('login.existsNotice') : searchParams.get('error');
  const from = location.state?.from;

  const destinationFor = (role) => (from && from !== '/login' ? from : getDashboardPathByRole(role));

  useEffect(() => {
    if (!loading && user) navigate(destinationFor(user.role), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const submit = async (event) => {
    event.preventDefault();
    if (!identifier.trim() || !password) return;
    setSubmitting(true);
    const loggedIn = await login(identifier.trim(), password);
    setSubmitting(false);
    if (loggedIn) navigate(destinationFor(loggedIn.role), { replace: true });
  };

  // Demo accounts sign in straight away and land on that role's home page.
  const demoLogin = async (demo) => {
    if (demoPending || submitting) return;
    setIdentifier(demo.email);
    setPassword(DEMO_PASSWORD);
    setDemoPending(demo.email);
    const loggedIn = await login(demo.email, DEMO_PASSWORD);
    setDemoPending('');
    if (loggedIn) navigate(getDashboardPathByRole(loggedIn.role), { replace: true });
  };

  const message = error || redirectNotice;

  return (
    <AuthLayout
      eyebrow={t('login.eyebrow')}
      title={t('login.title')}
      description={t('login.description')}
      footer={
        <>
          {t('login.newHere')}{' '}
          <Link to="/signup" className="link">
            {t('login.createAccount')}
          </Link>
        </>
      }
    >
      {message && (
        <div className="mb-6">
          <Notice tone="error">{message}</Notice>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label={t('login.identifier')} htmlFor="login-identifier">
          <input
            id="login-identifier"
            className="field"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="login-password" className="label !mb-0">
              {t('auth.password')}
            </label>
            <Link to="/forgot-password" className="text-[13px] text-ink-3 hover:text-ink">
              {t('login.forgot')}
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="field pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 icon-btn"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-dark btn-lg w-full" disabled={submitting || !identifier || !password}>
          {submitting ? t('login.signingIn') : t('login.submit')}
        </button>
      </form>

      {ENABLE_GOOGLE_OAUTH && (
        <>
          <div className="my-6 flex items-center gap-4 text-xs text-ink-3">
            <span className="h-px flex-1 bg-line" />
            {t('common.or')}
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton href={GOOGLE_AUTH_URL} label={t('auth.google')} />
        </>
      )}

      {SHOW_DEMO_ACCOUNTS && (
        <div className="mt-8 rounded-md border border-dashed border-line-strong p-4">
          <p className="text-[13px] font-medium text-ink">{t('login.demoTitle')}</p>
          <p className="mt-0.5 text-[13px] text-ink-3">{t('login.demoBody')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.email}
                data-demo-role={demo.key}
                type="button"
                className="btn-secondary btn-sm"
                disabled={Boolean(demoPending) || submitting}
                aria-busy={demoPending === demo.email}
                onClick={() => demoLogin(demo)}
              >
                {demoPending === demo.email ? (
                  <>
                    <span className="spinner" aria-hidden="true" /> {t('login.signingIn')}
                  </>
                ) : (
                  t(demo.label)
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
