/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-16
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import api from '../config/api';
import AuthLayout from '../components/AuthLayout';
import { Field, Notice } from '../components/ui';
import { Rich, useT } from '../i18n';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const t = useT();

  const submit = async (event) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError(t('forgot.err.email'));
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await api.post('/api/auth/forgot-password', { email: value });
      setSentTo(value);
    } catch (err) {
      setError(err?.response?.status === 429 ? t('common.rateLimited') : t('forgot.err.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const back = (
    <Link to="/login" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
      <ArrowLeft size={15} /> {t('auth.backToSignIn')}
    </Link>
  );

  if (sentTo) {
    return (
      <AuthLayout eyebrow={t('forgot.sentEyebrow')} title={t('forgot.sentTitle')} footer={back}>
        <div className="flex gap-4 rounded-md border border-line bg-surface p-5">
          <MailCheck size={20} className="mt-0.5 shrink-0 text-success" />
          <p className="text-sm leading-relaxed text-ink-2">
            <Rich text={t('forgot.sentBody', { email: sentTo })} emClassName="font-semibold not-italic text-ink" />
          </p>
        </div>
        <button type="button" className="btn-ghost btn-sm mt-5" onClick={() => setSentTo('')}>
          {t('forgot.differentEmail')}
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow={t('auth.recovery')}
      title={t('forgot.title')}
      description={t('forgot.description')}
      footer={back}
    >
      {error && (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label={t('auth.email')} htmlFor="fp-email">
          <input
            id="fp-email"
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </Field>
        <button type="submit" className="btn-dark btn-lg w-full" disabled={submitting}>
          {submitting ? t('forgot.sending') : t('forgot.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
