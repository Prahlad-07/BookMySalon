/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-14
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Minus, Phone, Plus, Star } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { buildDirectionsUrl } from '../config/mapbox';
import { formatDurationLabel, formatTimeLabel, openState, toMinuteOfDay } from '../utils/time';
import { Avatar, EmptyState, Notice, PageLoader, Stars, money } from '../components/ui';

const SLOT_STEP_MIN = 30;
const DAYS_AHEAD = 14;

const pad = (n) => String(n).padStart(2, '0');
const toBackend = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const fmtMinute = (m) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mm === 0 ? `${h12} ${suffix}` : `${h12}:${pad(mm)} ${suffix}`;
};

const extractError = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;

function RatingSummary({ reviews }) {
  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;
  const buckets = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => Math.round(r.rating) === n).length }));
  return (
    <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
      <div>
        <p className="num font-display text-[64px] leading-none text-ink">{total ? avg.toFixed(1) : '—'}</p>
        <Stars value={avg} size={15} className="mt-2" />
        <p className="mt-1.5 text-[13px] text-ink-3">
          {total} {total === 1 ? 'review' : 'reviews'}
        </p>
      </div>
      <div className="space-y-1.5">
        {buckets.map(({ n, count }) => (
          <div key={n} className="flex items-center gap-3 text-[13px] text-ink-3">
            <span className="num w-3">{n}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
              <div className="h-full rounded-full bg-gold" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
            </div>
            <span className="num w-5 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SalonDetail() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selected, setSelected] = useState([]);
  const [day, setDay] = useState(() => new Date());
  const [slot, setSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [booked, setBooked] = useState(null);

  const [review, setReview] = useState({ rating: 0, text: '' });
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ tone: '', text: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [salonData, serviceData, reviewData, categoryData] = await Promise.all([
        api.get(`/api/salons/${salonId}`),
        api.get(`/api/service-offerings/salon/${salonId}`),
        api.get(`/api/reviews/salon/${salonId}`),
        api.get(`/api/categories/salon/${salonId}`).catch(() => []),
      ]);
      setSalon(salonData);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      setLoadError(err?.response?.status === 404 ? 'missing' : extractError(err, 'We couldn’t load this salon.'));
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedServices = useMemo(() => {
    const names = Object.fromEntries(categories.map((c) => [String(c.id), c.name]));
    const groups = new Map();
    services.forEach((s) => {
      const key = names[String(s.categoryId)] || 'Services';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    });
    return Array.from(groups.entries());
  }, [services, categories]);

  const chosen = useMemo(() => services.filter((s) => selected.includes(s.id)), [services, selected]);
  const totalPrice = chosen.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalMinutes = Math.max(chosen.reduce((sum, s) => sum + (s.duration || 0), 0), chosen.length ? 15 : 0);

  const days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => new Date(start.getTime() + i * 86400000));
  }, []);

  const slots = useMemo(() => {
    if (!salon) return [];
    const open = toMinuteOfDay(salon.openTime);
    const close = toMinuteOfDay(salon.closeTime);
    if (open == null || close == null) return [];
    const duration = totalMinutes || 30;
    const now = new Date();
    const earliest = sameDay(day, now) ? now.getHours() * 60 + now.getMinutes() + 30 : -1;
    const list = [];
    for (let m = Math.ceil(open / SLOT_STEP_MIN) * SLOT_STEP_MIN; m + duration <= close; m += SLOT_STEP_MIN) {
      list.push({ minute: m, disabled: m < earliest });
    }
    return list;
  }, [salon, day, totalMinutes]);

  // Late in the day there may be nothing left — start on the next day with openings.
  useEffect(() => {
    if (!salon) return;
    const close = toMinuteOfDay(salon.closeTime);
    const now = new Date();
    if (close != null && now.getHours() * 60 + now.getMinutes() + 60 > close) {
      setDay(days[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon]);

  useEffect(() => {
    if (slot != null && !slots.some((s) => s.minute === slot && !s.disabled)) setSlot(null);
  }, [slots, slot]);

  const toggleService = (id) => {
    setBookingError('');
    setBooked(null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submitBooking = async () => {
    if (!chosen.length || slot == null) return;
    const start = new Date(day);
    start.setHours(Math.floor(slot / 60), slot % 60, 0, 0);
    const end = new Date(start.getTime() + totalMinutes * 60000);
    try {
      setBooking(true);
      setBookingError('');
      const result = await api.post('/api/bookings/me', {
        salonId: Number(salonId),
        startTime: toBackend(start),
        endTime: toBackend(end),
        serviceOfferingIds: chosen.map((s) => s.id),
      });
      setBooked({ ...result, start });
      setSelected([]);
      setSlot(null);
    } catch (err) {
      const message = extractError(err, 'We couldn’t place that booking. Please try again.');
      setBookingError(
        /already booked|overlap/i.test(message) ? 'That time was just taken. Please choose another slot.' : message
      );
    } finally {
      setBooking(false);
    }
  };

  const alreadyReviewed = reviews.some((r) => Number(r.userId) === Number(user?.id));

  const submitReview = async (event) => {
    event.preventDefault();
    if (!review.rating) return setReviewMessage({ tone: 'error', text: 'Choose a star rating.' });
    if (review.text.trim().length < 10) return setReviewMessage({ tone: 'error', text: 'Write at least 10 characters.' });
    try {
      setReviewBusy(true);
      await api.post(`/api/reviews/${user.id}`, {
        salonId: Number(salonId),
        rating: review.rating,
        text: review.text.trim(),
      });
      setReview({ rating: 0, text: '' });
      setReviewMessage({ tone: 'success', text: 'Thanks — your review is live.' });
      const fresh = await api.get(`/api/reviews/salon/${salonId}`);
      setReviews(Array.isArray(fresh) ? fresh : []);
    } catch (err) {
      setReviewMessage({ tone: 'error', text: extractError(err, 'We couldn’t post your review.') });
    } finally {
      setReviewBusy(false);
    }
    return undefined;
  };

  if (loading) return <PageLoader label="Loading salon" />;

  if (loadError || !salon) {
    return (
      <div className="page">
        <EmptyState
          title={loadError === 'missing' ? 'This salon isn’t listed anymore.' : 'Something went wrong.'}
          description={loadError === 'missing' ? 'It may have been removed by its owner.' : loadError}
          action={
            <Link to="/salons" className="btn-dark">
              Browse other salons
            </Link>
          }
        />
      </div>
    );
  }

  const state = openState(salon.openTime, salon.closeTime);
  const rating = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;
  const directions = buildDirectionsUrl(null, { latitude: Number(salon.latitude), longitude: Number(salon.longitude) });
  const image = (salon.images || [])[0];

  return (
    <div className="page !pt-8">
      <Link to="/salons" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft size={15} /> All salons
      </Link>

      <header className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="display text-[48px] text-ink sm:text-[64px]">{salon.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
            {reviews.length > 0 ? (
              <a href="#reviews" className="flex items-center gap-2 hover:text-ink">
                <Stars value={rating} />
                <span className="num font-semibold text-ink">{rating.toFixed(1)}</span>
                <span className="text-ink-3">({reviews.length})</span>
              </a>
            ) : (
              <span className="text-ink-3">No reviews yet</span>
            )}
            <span className="hidden text-line-strong sm:inline">|</span>
            <span>{[salon.address, salon.city].filter(Boolean).join(', ')}</span>
            {state && (
              <>
                <span className="hidden text-line-strong sm:inline">|</span>
                <span className={`flex items-center gap-1.5 ${state.open ? 'text-success' : ''}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${state.open ? 'bg-success' : 'bg-ink-3'}`} />
                  {state.label}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {directions && (
            <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Directions <ArrowUpRight size={15} />
            </a>
          )}
          {isCustomer && salon.ownerId && (
            <Link to={`/chat/${salon.ownerId}`} className="btn-secondary">
              Message
            </Link>
          )}
        </div>
      </header>

      {image && (
        <div className="mt-8 overflow-hidden rounded-lg bg-sunken">
          <img src={image} alt={`Inside ${salon.name}`} className="aspect-[21/9] w-full object-cover" />
        </div>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div className="min-w-0">
          {/* Menu */}
          <section aria-labelledby="menu-heading">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <h2 id="menu-heading" className="display text-[34px] text-ink">
                Menu
              </h2>
              <p className="text-sm text-ink-3">{services.length} services</p>
            </div>

            {services.length === 0 ? (
              <p className="py-10 text-ink-2">This salon hasn’t published its menu yet.</p>
            ) : (
              groupedServices.map(([group, items]) => (
                <div key={group} className="mt-8">
                  <p className="eyebrow mb-1">{group}</p>
                  <ul>
                    {items.map((service) => {
                      const active = selected.includes(service.id);
                      return (
                        <li key={service.id} className="flex items-start gap-4 border-b border-line py-5">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink">{service.name}</p>
                            {service.description && (
                              <p className="mt-1 text-sm leading-relaxed text-ink-2">{service.description}</p>
                            )}
                            <p className="mt-1.5 text-[13px] text-ink-3">{formatDurationLabel(service.duration)}</p>
                          </div>
                          <p className="num pt-0.5 font-semibold text-ink">{money(service.price)}</p>
                          {isCustomer && (
                            <button
                              type="button"
                              onClick={() => toggleService(service.id)}
                              className={`btn-sm btn min-w-[84px] ${
                                active ? 'bg-ink text-paper hover:bg-ink/85' : 'border border-line-strong bg-surface hover:border-ink/40'
                              }`}
                              aria-pressed={active}
                              aria-label={`${active ? 'Remove' : 'Add'} ${service.name}`}
                            >
                              {active ? (
                                <>
                                  <Check size={14} /> Added
                                </>
                              ) : (
                                <>
                                  <Plus size={14} /> Add
                                </>
                              )}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </section>

          {/* About */}
          <section className="mt-16" aria-labelledby="about-heading">
            <h2 id="about-heading" className="display border-b border-line pb-4 text-[34px] text-ink">
              Visit
            </h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">Address</dt>
                <dd className="mt-2 text-sm text-ink">{[salon.address, salon.city].filter(Boolean).join(', ')}</dd>
              </div>
              <div>
                <dt className="eyebrow">Hours</dt>
                <dd className="mt-2 text-sm text-ink">
                  Daily, {formatTimeLabel(salon.openTime)} – {formatTimeLabel(salon.closeTime)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Contact</dt>
                <dd className="mt-2 space-y-1 text-sm text-ink">
                  {salon.phoneNumber && (
                    <a href={`tel:${salon.phoneNumber}`} className="flex items-center gap-1.5 hover:underline">
                      <Phone size={13} /> {salon.phoneNumber}
                    </a>
                  )}
                  {salon.email && (
                    <a href={`mailto:${salon.email}`} className="block truncate hover:underline">
                      {salon.email}
                    </a>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Reviews */}
          <section id="reviews" className="mt-16 scroll-mt-24" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="display border-b border-line pb-4 text-[34px] text-ink">
              Reviews
            </h2>
            <div className="mt-8">
              <RatingSummary reviews={reviews} />
            </div>

            {isCustomer && !alreadyReviewed && (
              <form onSubmit={submitReview} className="mt-10 rounded-lg border border-line bg-surface p-6">
                <p className="font-semibold text-ink">Been here? Share how it went.</p>
                <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={review.rating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      onClick={() => setReview((r) => ({ ...r, rating: n }))}
                      className="rounded p-0.5"
                    >
                      <Star
                        size={24}
                        strokeWidth={1.5}
                        className={n <= review.rating ? 'fill-gold text-gold' : 'text-line-strong hover:text-gold'}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  className="field mt-4"
                  rows={3}
                  maxLength={1000}
                  placeholder="What did you have done, and how was it?"
                  value={review.text}
                  onChange={(e) => setReview((r) => ({ ...r, text: e.target.value }))}
                />
                {reviewMessage.text && (
                  <p className={`mt-3 text-sm ${reviewMessage.tone === 'error' ? 'text-danger' : 'text-success'}`}>
                    {reviewMessage.text}
                  </p>
                )}
                <button type="submit" className="btn-dark mt-4" disabled={reviewBusy}>
                  {reviewBusy ? 'Posting…' : 'Post review'}
                </button>
              </form>
            )}

            <ul className="mt-10">
              {reviews.length === 0 && <li className="text-ink-2">No reviews yet — be the first after your visit.</li>}
              {reviews.map((r) => (
                <li key={r.id} className="flex gap-4 border-b border-line py-6 last:border-0">
                  <Avatar name={r.reviewerName} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink">{r.reviewerName || 'Guest'}</p>
                      <p className="text-[13px] text-ink-3">
                        {r.createdAt &&
                          new Date(r.createdAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                      </p>
                    </div>
                    <Stars value={r.rating} size={12} className="mt-1" />
                    <p className="mt-2.5 leading-relaxed text-ink-2">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Booking panel */}
        <aside id="book" className="min-w-0 scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-line bg-surface">
            <div className="border-b border-line p-5">
              <p className="eyebrow">Book an appointment</p>
            </div>

            {!isCustomer ? (
              <p className="p-5 text-sm text-ink-2">
                {user?.role === 'SALON_OWNER'
                  ? 'You’re viewing this as a salon owner. Switch to a customer account to book.'
                  : 'Booking is available to customer accounts.'}
              </p>
            ) : booked ? (
              <div className="p-5">
                <p className="display text-[30px] text-ink">Request sent.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  {booked.start.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
                  {booked.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}. {salon.name}{' '}
                  will confirm shortly — we’ll notify you.
                </p>
                <div className="mt-5 flex gap-2">
                  <button type="button" className="btn-dark flex-1" onClick={() => navigate('/bookings')}>
                    View appointment
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setBooked(null)}>
                    Book another
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5">
                  <p className="text-[13px] font-medium text-ink-2">1 · Services</p>
                  {chosen.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-3">Add services from the menu.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {chosen.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate text-ink">{s.name}</span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="num text-ink-2">{money(s.price)}</span>
                            <button
                              type="button"
                              className="icon-btn !h-6 !w-6"
                              onClick={() => toggleService(s.id)}
                              aria-label={`Remove ${s.name}`}
                            >
                              <Minus size={13} />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-line p-5">
                  <p className="text-[13px] font-medium text-ink-2">2 · Day</p>
                  <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
                    {days.map((d) => {
                      const active = sameDay(d, day);
                      return (
                        <button
                          key={d.toISOString()}
                          type="button"
                          onClick={() => setDay(d)}
                          className={`flex w-12 shrink-0 flex-col items-center rounded-md border py-2 transition ${
                            active ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink/40'
                          }`}
                          aria-pressed={active}
                        >
                          <span className={`text-[10.5px] uppercase tracking-wide ${active ? 'text-paper/70' : 'text-ink-3'}`}>
                            {d.toLocaleDateString(undefined, { weekday: 'short' })}
                          </span>
                          <span className="num mt-0.5 text-[17px] font-semibold">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-line p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[13px] font-medium text-ink-2">3 · Time</p>
                    {totalMinutes > 0 && <p className="text-[12px] text-ink-3">{formatDurationLabel(totalMinutes)} visit</p>}
                  </div>
                  {slots.filter((s) => !s.disabled).length === 0 ? (
                    <p className="mt-3 text-sm text-ink-3">No times left on this day. Try another day.</p>
                  ) : (
                    <div className="mt-3 grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto scrollbar-thin">
                      {slots.map((s) => (
                        <button
                          key={s.minute}
                          type="button"
                          disabled={s.disabled}
                          onClick={() => setSlot(s.minute)}
                          className={`num h-9 rounded-md border text-[13px] transition disabled:cursor-not-allowed disabled:border-transparent disabled:text-ink-3/50 disabled:line-through ${
                            slot === s.minute ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink/40'
                          }`}
                        >
                          {fmtMinute(s.minute)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-line p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ink-2">Total</span>
                    <span className="num font-display text-[30px] leading-none text-ink">{money(totalPrice)}</span>
                  </div>
                  {bookingError && (
                    <div className="mt-4">
                      <Notice tone="error">{bookingError}</Notice>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-primary btn-lg mt-4 w-full"
                    onClick={submitBooking}
                    disabled={booking || !chosen.length || slot == null}
                  >
                    {booking
                      ? 'Sending request…'
                      : !chosen.length
                        ? 'Add a service to continue'
                        : slot == null
                          ? 'Choose a time'
                          : `Request ${fmtMinute(slot)}`}
                  </button>
                  <p className="mt-3 text-center text-[12px] text-ink-3">
                    The salon confirms every request. You can reschedule or cancel anytime.
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {isCustomer && chosen.length > 0 && !booked && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-semibold text-ink">
                {chosen.length} {chosen.length === 1 ? 'service' : 'services'} · {money(totalPrice)}
              </p>
              <p className="text-ink-3">{slot == null ? 'Pick a day and time' : fmtMinute(slot)}</p>
            </div>
            <a href="#book" className="btn-primary">
              {slot == null ? 'Choose time' : 'Review'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
