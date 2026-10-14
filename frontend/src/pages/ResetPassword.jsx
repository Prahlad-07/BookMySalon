/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-16
 */
import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../config/api';
import AuthLayout from '../components/AuthLayout';
import { Field, Notice } from '../components/ui';
import { useT } from '../i18n';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const t = useT();

  const back = (
    <Link to="/login" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
      <ArrowLeft size={15} /> {t('auth.backToSignIn')}
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout eyebrow={t('auth.recovery')} title={t('reset.incompleteTitle')} footer={back}>
        <p className="text-ink-2">{t('reset.incompleteBody')}</p>
        <Link to="/forgot-password" className="btn-dark btn-lg mt-8 w-full">
          {t('reset.requestNew')}
        </Link>
      </AuthLayout>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setError(t('auth.err.min8'));
    if (password !== confirm) return setError(t('auth.err.mismatch'));
    try {
      setSubmitting(true);
      setError('');
      await api.post('/api/auth/reset-password', { token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(err?.response?.status === 429 ? t('common.rateLimited') : t('reset.err.expired'));
    } finally {
      setSubmitting(false);
    }
    return undefined;
  };

  return (
    <AuthLayout
      eyebrow={t('auth.recovery')}
      title={t('reset.title')}
      description={t('reset.description')}
      footer={back}
    >
      {error && (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      {done ? (
        <Notice tone="success">{t('reset.done')}</Notice>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="rp-password" className="label">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <input
                id="rp-password"
                type={show ? 'text' : 'password'}
                className="field pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
                aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Field label={t('auth.confirmNewPassword')} htmlFor="rp-confirm">
            <input
              id="rp-confirm"
              type={show ? 'text' : 'password'}
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <button type="submit" className="btn-dark btn-lg w-full" disabled={submitting}>
            {submitting ? t('auth.updating') : t('auth.updatePassword')}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
