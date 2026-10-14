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
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useT } from '../i18n';
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
  const t = useT();

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
    if (!details.fullName.trim()) return setDetailsMsg({ tone: 'error', text: t('profile.err.name') });
    try {
      setSavingDetails(true);
      const updated = await api.put('/api/user/me', { fullName: details.fullName.trim(), phone: details.phone.trim() });
      setUser((current) => ({
        ...current,
        name: updated.fullName,
        fullName: updated.fullName,
        phone: updated.phone || '',
      }));
      setDetailsMsg({ tone: 'success', text: t('profile.saved') });
    } catch (err) {
      setDetailsMsg({ tone: 'error', text: errorOf(err, t('profile.err.save')) });
    } finally {
      setSavingDetails(false);
    }
    return undefined;
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (pw.next.length < 8) return setPwMsg({ tone: 'error', text: t('auth.err.min8') });
    if (pw.next !== pw.confirm) return setPwMsg({ tone: 'error', text: t('auth.err.mismatch') });
    try {
      setSavingPw(true);
      await api.put('/api/user/me/password', { currentPassword: pw.current, newPassword: pw.next });
      // Other sessions were revoked server-side; refresh this one with the new password.
      await login(user.email, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ tone: 'success', text: t('profile.pwUpdated') });
    } catch (err) {
      setPwMsg({ tone: 'error', text: errorOf(err, t('profile.err.password')) });
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
      setDeleteError(errorOf(err, t('profile.err.delete')));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const msg = (m) =>
    m.text ? <p className={`text-sm ${m.tone === 'error' ? 'text-danger' : 'text-success'}`}>{m.text}</p> : null;

  return (
    <div className="page">
      <PageHeader eyebrow={t('title.profile')} title={t('profile.title')} />

      <div className="mt-10 flex items-center gap-4">
        <Avatar name={user.fullName || user.name} size={56} />
        <div>
          <p className="text-[17px] font-semibold text-ink">{user.fullName || user.name}</p>
          <p className="text-sm text-ink-3">
            {user.email} · {t(`role.${user.role || 'MEMBER'}`)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Section title={t('profile.details')} description={t('profile.detailsBody')}>
          <form onSubmit={saveDetails} className="space-y-5">
            <Field label={t('auth.fullName')} htmlFor="pf-name">
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
            <Field label={t('profile.phone')} htmlFor="pf-phone" hint={t('profile.phoneHint')}>
              <input
                id="pf-phone"
                type="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                className="field"
                value={details.phone}
                autoComplete="tel"
                onChange={(e) => {
                  setDetails((d) => ({ ...d, phone: e.target.value }));
                  setDetailsMsg({ tone: '', text: '' });
                }}
              />
            </Field>
            <Field label={t('auth.email')} htmlFor="pf-email" hint={t('profile.emailHint')}>
              <input id="pf-email" className="field" value={user.email} disabled />
            </Field>
            <div className="flex items-center gap-4">
              <button type="submit" className="btn-dark" disabled={!dirty || savingDetails}>
                {savingDetails ? t('common.saving') : t('profile.saveChanges')}
              </button>
              {msg(detailsMsg)}
            </div>
          </form>
        </Section>

        <Section title={t('auth.password')} description={t('profile.passwordBody')}>
          <form onSubmit={savePassword} className="space-y-5">
            <Field label={t('profile.currentPassword')} htmlFor="pf-cur">
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
              <Field label={t('auth.newPassword')} htmlFor="pf-new">
                <input
                  id="pf-new"
                  type="password"
                  className="field"
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                />
              </Field>
              <Field label={t('auth.confirmNewPassword')} htmlFor="pf-confirm">
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
                {savingPw ? t('auth.updating') : t('auth.updatePassword')}
              </button>
              {msg(pwMsg)}
            </div>
          </form>
        </Section>

        <Section title={t('lang.label')} description={t('profile.languageBody')}>
          <LanguageSwitcher variant="grid" />
        </Section>

        <Section title={t('profile.appearance')} description={t('profile.appearanceBody')}>
          <div className="inline-flex rounded-md border border-line-strong p-1" role="radiogroup" aria-label={t('profile.theme')}>
            {[
              ['light', t('profile.light')],
              ['dark', t('profile.dark')],
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

        <Section title={t('profile.close')} description={t('profile.closeBody')}>
          {deleteError && (
            <div className="mb-4">
              <Notice tone="error">{deleteError}</Notice>
            </div>
          )}
          <p className="text-sm leading-relaxed text-ink-2">
            {user.role === 'SALON_OWNER' ? t('profile.closeOwner') : t('profile.closeCustomer')}
          </p>
          <button type="button" className="btn-danger mt-4" onClick={() => setConfirmDelete(true)}>
            {t('profile.closeMine')}
          </button>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t('profile.closeTitle')}
        description={t('profile.closeDialog')}
        confirmLabel={t('profile.close')}
        cancelLabel={t('profile.keep')}
        busy={deleting}
        onConfirm={deleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
