/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-14
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, MessageCircle } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, Notice, PageHeader, PageLoader, StatusTag, money } from '../components/ui';
import { formatDurationLabel } from '../utils/time';

const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toBackend = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const extractError = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;
const timeOf = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

function relativeDay(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return null;
}

function DateBlock({ date, muted }) {
  return (
    <div className={`flex w-[72px] shrink-0 self-start flex-col items-center rounded-md border py-3 ${muted ? 'border-line text-ink-3' : 'border-line-strong bg-surface'}`}>
      <span className="text-[10.5px] font-semibold uppercase tracking-label text-ink-3">
        {date.toLocaleDateString(undefined, { month: 'short' })}
      </span>
      <span className={`num font-display text-[36px] leading-none ${muted ? '' : 'text-ink'}`}>{date.getDate()}</span>
      <span className="mt-0.5 text-[11px] text-ink-3">{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
    </div>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState({});
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('upcoming');
  const [rescheduling, setRescheduling] = useState(null);
  const [draft, setDraft] = useState('');
  const [pendingCancel, setPendingCancel] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/api/bookings/user/${user.id}`);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractError(err, 'We couldn’t load your appointments.'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get('/api/payments/config')
      .then((config) => setPaymentsEnabled(Boolean(config?.enabled)))
      .catch(() => setPaymentsEnabled(false));
  }, []);

  const now = Date.now();
  const { upcoming, past } = useMemo(() => {
    const up = [];
    const done = [];
    bookings.forEach((b) => {
      const active = b.status === 'PENDING' || b.status === 'CONFIRMED';
      if (active && new Date(b.endTime).getTime() > now) up.push(b);
      else done.push(b);
    });
    up.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    done.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    return { upcoming: up, past: done };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  useEffect(() => {
    if (!paymentsEnabled || upcoming.length === 0) return undefined;
    let active = true;
    Promise.all(
      upcoming.map((b) =>
        api
          .get(`/api/payments/booking/${b.id}`)
          .then((list) => [b.id, Array.isArray(list) ? list : []])
          .catch(() => [b.id, []])
      )
    ).then((entries) => active && setPayments(Object.fromEntries(entries)));
    return () => {
      active = false;
    };
  }, [paymentsEnabled, upcoming]);

  const isPaid = (id) => (payments[id] || []).some((p) => p.status === 'COMPLETED');

  const saveReschedule = async (booking) => {
    const start = new Date(draft);
    if (Number.isNaN(start.getTime()) || start <= new Date()) {
      setError('Choose a time in the future.');
      return;
    }
    const duration = new Date(booking.endTime) - new Date(booking.startTime);
    const end = new Date(start.getTime() + Math.max(duration, 15 * 60000));
    try {
      setBusyId(booking.id);
      setError('');
      const updated = await api.put(`/api/bookings/${booking.id}`, { startTime: toBackend(start), endTime: toBackend(end) });
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, ...updated } : b)));
      setRescheduling(null);
      setNotice('Your appointment was moved. The salon has the new time.');
    } catch (err) {
      setError(extractError(err, 'That time isn’t available. Try another.'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmCancel = async () => {
    const id = pendingCancel;
    try {
      setBusyId(id);
      await api.delete(`/api/bookings/${id}`);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)));
      setNotice('Appointment cancelled. The salon has been notified.');
    } catch (err) {
      setError(extractError(err, 'We couldn’t cancel that appointment.'));
    } finally {
      setBusyId(null);
      setPendingCancel(null);
    }
  };

  const pay = async (id) => {
    try {
      setBusyId(id);
      const link = await api.post(`/api/payments/checkout/${id}`);
      if (link?.paymentLink) window.location.assign(link.paymentLink);
      else setError('Checkout couldn’t start. Please try again.');
    } catch (err) {
      setError(extractError(err, 'Checkout couldn’t start. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader label="Loading appointments" />;

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Appointments"
        title="Your appointments"
        description="Everything you’ve booked, in one place. Move or cancel a visit whenever plans change."
        actions={
          <Link to="/salons" className="btn-primary">
            Book a visit
          </Link>
        }
      />

      <div className="tabs mt-8" role="tablist">
        {[
          ['upcoming', 'Upcoming', upcoming.length],
          ['past', 'Past & cancelled', past.length],
        ].map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className="tab"
            onClick={() => setTab(key)}
          >
            {label} <span className="num ml-1 text-ink-3">{count}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {notice && <Notice tone="success" onDismiss={() => setNotice('')}>{notice}</Notice>}
        {error && <Notice tone="error" onDismiss={() => setError('')}>{error}</Notice>}
      </div>

      {list.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={tab === 'upcoming' ? 'Nothing on the books.' : 'No past visits yet.'}
          description={
            tab === 'upcoming'
              ? 'When you book a visit, it’ll show up here with everything you need for the day.'
              : 'Completed and cancelled appointments will appear here.'
          }
          action={
            tab === 'upcoming' && (
              <Link to="/salons" className="btn-dark">
                Find a salon
              </Link>
            )
          }
        />
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {list.map((b) => {
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const minutes = Math.round((end - start) / 60000);
            const upcomingItem = tab === 'upcoming';
            const soon = upcomingItem ? relativeDay(start) : null;
            const paid = isPaid(b.id);
            const busy = busyId === b.id;

            return (
              <li key={b.id} className="py-6">
                <div className="flex gap-5">
                  <DateBlock date={start} muted={!upcomingItem} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {soon && <span className="tag-accent">{soon}</span>}
                          <StatusTag status={b.status} />
                          {paid && <span className="tag-success">Paid</span>}
                        </div>
                        <Link
                          to={`/salon/${b.salonId}`}
                          className="mt-2 block text-[18px] font-semibold text-ink hover:underline hover:decoration-line-strong hover:underline-offset-4"
                        >
                          {b.salonName || `Salon #${b.salonId}`}
                        </Link>
                        <p className="mt-1 text-sm text-ink-2">
                          {timeOf(start)} – {timeOf(end)} · {formatDurationLabel(minutes)}
                          {b.salonCity ? ` · ${b.salonCity}` : ''}
                        </p>
                        {b.serviceNames?.length > 0 && (
                          <p className="mt-1 text-sm text-ink-3">{b.serviceNames.join(', ')}</p>
                        )}
                      </div>
                      <p className="num font-display text-[26px] leading-none text-ink">{money(b.totalPrice)}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {upcomingItem ? (
                        <>
                          {paymentsEnabled && !paid && (
                            <button type="button" className="btn-primary btn-sm" onClick={() => pay(b.id)} disabled={busy}>
                              <CreditCard size={14} /> Pay {money(b.totalPrice)}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => {
                              setRescheduling(rescheduling === b.id ? null : b.id);
                              setDraft(toLocalInput(b.startTime));
                            }}
                            aria-expanded={rescheduling === b.id}
                          >
                            Reschedule
                          </button>
                          {b.salonOwnerId && Number(b.salonOwnerId) !== Number(user?.id) && (
                            <Link to={`/chat/${b.salonOwnerId}`} className="btn-ghost btn-sm">
                              <MessageCircle size={14} /> Message salon
                            </Link>
                          )}
                          <button
                            type="button"
                            className="btn-ghost btn-sm text-danger hover:bg-danger-soft hover:text-danger"
                            onClick={() => setPendingCancel(b.id)}
                            disabled={busy}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to={`/salon/${b.salonId}`} className="btn-secondary btn-sm">
                            Book again
                          </Link>
                          {b.status === 'COMPLETED' && (
                            <Link to={`/salon/${b.salonId}#reviews`} className="btn-ghost btn-sm">
                              Leave a review
                            </Link>
                          )}
                        </>
                      )}
                    </div>

                    {rescheduling === b.id && (
                      <div className="mt-4 flex flex-col gap-3 rounded-md border border-line bg-surface p-4 sm:flex-row sm:items-end">
                        <label className="flex-1">
                          <span className="label">New date and time</span>
                          <input
                            type="datetime-local"
                            className="field"
                            value={draft}
                            min={toLocalInput(new Date(Date.now() + 30 * 60000))}
                            onChange={(e) => setDraft(e.target.value)}
                          />
                        </label>
                        <div className="flex gap-2">
                          <button type="button" className="btn-dark" onClick={() => saveReschedule(b)} disabled={busy}>
                            {busy ? 'Saving…' : 'Save new time'}
                          </button>
                          <button type="button" className="btn-ghost" onClick={() => setRescheduling(null)}>
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingCancel != null}
        title="Cancel this appointment?"
        description="The salon will be notified and the slot released for someone else. This can’t be undone."
        confirmLabel="Cancel appointment"
        cancelLabel="Keep it"
        busy={busyId != null && busyId === pendingCancel}
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
}
