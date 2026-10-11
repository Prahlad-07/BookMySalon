/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-13
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { Avatar, Field, Notice, PageHeader } from '../components/ui';

const ROLE_LABEL = { CUSTOMER: 'Customer', SALON_OWNER: 'Salon owner', ADMIN: 'Administrator' };
const errorOf = (err, fallback) => err?.response?.data?.error || fallback;

function Section({ title, description, children }) {
  return (
    <section className="grid gap-6 border-b border-line py-10 last:border-0 md:grid-cols-[260px_minmax(0,1fr)] md:gap-12">
      <div>
        <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{description}</p>}
      </div>
      <div className="max-w-xl">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { user, setUser, logout, login } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [details, setDetails] = useState({ fullName: '', phone: '' });
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState({ tone: '', text: '' });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState({ tone: '', text: '' });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setDetails({ fullName: user?.fullName || user?.name || '', phone: user?.phone || '' });
  }, [user]);

  if (!user) return null;

  const dirty = details.fullName.trim() !== (user.fullName || user.name || '') || details.phone.trim() !== (user.phone || '');

  const saveDetails = async (event) => {
    event.preventDefault();
    if (!details.fullName.trim()) return setDetailsMsg({ tone: 'error', text: 'Your name can’t be empty.' });
    try {
      setSavingDetails(true);
      const updated = await api.put('/api/user/me', { fullName: details.fullName.trim(), phone: details.phone.trim() });
      setUser((current) => ({
        ...current,
        name: updated.fullName,
        fullName: updated.fullName,
        phone: updated.phone || '',
      }));
      setDetailsMsg({ tone: 'success', text: 'Saved.' });
    } catch (err) {
      setDetailsMsg({ tone: 'error', text: errorOf(err, 'We couldn’t save your details.') });
    } finally {
      setSavingDetails(false);
    }
    return undefined;
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (pw.next.length < 8) return setPwMsg({ tone: 'error', text: 'Use at least 8 characters.' });
    if (pw.next !== pw.confirm) return setPwMsg({ tone: 'error', text: 'The new passwords don’t match.' });
    try {
      setSavingPw(true);
      await api.put('/api/user/me/password', { currentPassword: pw.current, newPassword: pw.next });
      // Other sessions were revoked server-side; refresh this one with the new password.
      await login(user.email, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ tone: 'success', text: 'Password updated. You’ve been signed out on other devices.' });
    } catch (err) {
      setPwMsg({ tone: 'error', text: errorOf(err, 'We couldn’t update your password.') });
    } finally {
      setSavingPw(false);
    }
    return undefined;
  };

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      setDeleteError('');
      await api.delete('/api/user/me');
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(errorOf(err, 'We couldn’t close your account.'));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const msg = (m) =>
    m.text ? <p className={`text-sm ${m.tone === 'error' ? 'text-danger' : 'text-success'}`}>{m.text}</p> : null;

  return (
    <div className="page">
      <PageHeader eyebrow="Account" title="Settings" />

      <div className="mt-10 flex items-center gap-4">
        <Avatar name={user.fullName || user.name} size={56} />
        <div>
          <p className="text-[17px] font-semibold text-ink">{user.fullName || user.name}</p>
          <p className="text-sm text-ink-3">
            {user.email} · {ROLE_LABEL[user.role] || 'Member'}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Section title="Personal details" description="Salons see your name and phone number on your appointments.">
          <form onSubmit={saveDetails} className="space-y-5">
            <Field label="Full name" htmlFor="pf-name">
              <input
                id="pf-name"
                className="field"
                value={details.fullName}
                maxLength={120}
                autoComplete="name"
                onChange={(e) => {
                  setDetails((d) => ({ ...d, fullName: e.target.value }));
                  setDetailsMsg({ tone: '', text: '' });
                }}
              />
            </Field>
            <Field label="Phone" htmlFor="pf-phone" hint="Optional — used by salons to reach you about a booking.">
              <input
                id="pf-phone"
                type="tel"
                className="field"
                value={details.phone}
                autoComplete="tel"
                onChange={(e) => {
                  setDetails((d) => ({ ...d, phone: e.target.value }));
                  setDetailsMsg({ tone: '', text: '' });
                }}
              />
            </Field>
            <Field label="Email" htmlFor="pf-email" hint="Your sign-in email can’t be changed here.">
              <input id="pf-email" className="field" value={user.email} disabled />
            </Field>
            <div className="flex items-center gap-4">
              <button type="submit" className="btn-dark" disabled={!dirty || savingDetails}>
                {savingDetails ? 'Saving…' : 'Save changes'}
              </button>
              {msg(detailsMsg)}
            </div>
          </form>
        </Section>

        <Section title="Password" description="Changing your password signs you out everywhere else.">
          <form onSubmit={savePassword} className="space-y-5">
            <Field label="Current password" htmlFor="pf-cur">
              <input
                id="pf-cur"
                type="password"
                className="field"
                autoComplete="current-password"
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="New password" htmlFor="pf-new">
                <input
                  id="pf-new"
                  type="password"
                  className="field"
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                />
              </Field>
              <Field label="Confirm new password" htmlFor="pf-confirm">
                <input
                  id="pf-confirm"
                  type="password"
                  className="field"
                  autoComplete="new-password"
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                />
              </Field>
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" className="btn-dark" disabled={savingPw || !pw.current || !pw.next}>
                {savingPw ? 'Updating…' : 'Update password'}
              </button>
              {msg(pwMsg)}
            </div>
          </form>
        </Section>

        <Section title="Appearance" description="Choose how BookMySalon looks on this device.">
          <div className="inline-flex rounded-md border border-line-strong p-1" role="radiogroup" aria-label="Theme">
            {[
              ['light', 'Light'],
              ['dark', 'Dark'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={`h-8 rounded px-4 text-sm font-medium transition ${
                  theme === value ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Close account" description="Permanently delete your account and sign-in details.">
          {deleteError && (
            <div className="mb-4">
              <Notice tone="error">{deleteError}</Notice>
            </div>
          )}
          <p className="text-sm leading-relaxed text-ink-2">
            {user.role === 'SALON_OWNER'
              ? 'Delete or transfer your salon profile first. Closing your account can’t be undone.'
              : 'Your upcoming appointments should be cancelled first. This can’t be undone.'}
          </p>
          <button type="button" className="btn-danger mt-4" onClick={() => setConfirmDelete(true)}>
            Close my account
          </button>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Close your account?"
        description="Your profile and sign-in details will be deleted. This can’t be undone."
        confirmLabel="Close account"
        cancelLabel="Keep account"
        busy={deleting}
        onConfirm={deleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
