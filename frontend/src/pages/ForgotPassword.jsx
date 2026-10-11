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

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError('Enter the email address on your account.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await api.post('/api/auth/forgot-password', { email: value });
      setSentTo(value);
    } catch (err) {
      setError(
        err?.response?.status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : 'We couldn’t process that right now. Please try again shortly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const back = (
    <Link to="/login" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
      <ArrowLeft size={15} /> Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthLayout eyebrow="Check your inbox" title="Reset link sent" footer={back}>
        <div className="flex gap-4 rounded-md border border-line bg-surface p-5">
          <MailCheck size={20} className="mt-0.5 shrink-0 text-success" />
          <p className="text-sm leading-relaxed text-ink-2">
            If an account exists for <span className="font-semibold text-ink">{sentTo}</span>, you’ll receive an email
            with a link to choose a new password. The link expires in 30 minutes.
          </p>
        </div>
        <button type="button" className="btn-ghost btn-sm mt-5" onClick={() => setSentTo('')}>
          Use a different email
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter the email you signed up with and we’ll send you a secure link to set a new one."
      footer={back}
    >
      {error && (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="fp-email">
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
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}
