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
import { useT } from '../i18n';
import { formatDate, formatTime } from '../i18n/format';

const SLOT_STEP_MIN = 30;
const DAYS_AHEAD = 14;

const pad = (n) => String(n).padStart(2, '0');
const toBackend = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const fmtMinute = (m) => {
  const d = new Date();
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return formatTime(d);
};

const extractError = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;

function RatingSummary({ reviews }) {
  const t = useT();
  const total = reviews.length;
  const avg = total ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;
  const buckets = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => Math.round(r.rating) === n).length }));
  return (
    <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
      <div>
        <p className="num font-display text-[64px] leading-none text-ink">{total ? avg.toFixed(1) : '—'}</p>
        <Stars value={avg} size={15} className="mt-2" />
        <p className="mt-1.5 text-[13px] text-ink-3">{t('salon.reviewCount', { count: total })}</p>
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
  const t = useT();
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
      setLoadError(err?.response?.status === 404 ? 'missing' : extractError(err, t('salon.err.load')));
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
      const key = names[String(s.categoryId)] || t('salon.servicesGroup');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    });
    return Array.from(groups.entries());
  }, [services, categories, t]);

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
      const message = extractError(err, t('salon.err.book'));
      setBookingError(
        err?.response?.status === 409 || /already booked|overlap/i.test(message) ? t('salon.err.taken') : message
      );
    } finally {
      setBooking(false);
    }
  };

  const alreadyReviewed = reviews.some((r) => Number(r.userId) === Number(user?.id));

  const submitReview = async (event) => {
    event.preventDefault();
    if (!review.rating) return setReviewMessage({ tone: 'error', text: t('salon.review.err.rating') });
    if (review.text.trim().length < 10) return setReviewMessage({ tone: 'error', text: t('salon.review.err.length') });
    try {
      setReviewBusy(true);
      await api.post(`/api/reviews/${user.id}`, {
        salonId: Number(salonId),
        rating: review.rating,
        text: review.text.trim(),
      });
      setReview({ rating: 0, text: '' });
      setReviewMessage({ tone: 'success', text: t('salon.review.posted') });
      const fresh = await api.get(`/api/reviews/salon/${salonId}`);
      setReviews(Array.isArray(fresh) ? fresh : []);
    } catch (err) {
      setReviewMessage({
        tone: 'error',
        text: err?.response?.status === 409 ? t('salon.review.err.duplicate') : extractError(err, t('salon.review.err.post')),
      });
    } finally {
      setReviewBusy(false);
    }
    return undefined;
  };

  if (loading) return <PageLoader label={t('salon.loading')} />;

  if (loadError || !salon) {
    return (
      <div className="page">
        <EmptyState
          title={loadError === 'missing' ? t('salon.missing') : t('crash.title')}
          description={loadError === 'missing' ? t('salon.missingBody') : loadError}
          action={
            <Link to="/salons" className="btn-dark">
              {t('salon.browseOther')}
            </Link>
          }
        />
      </div>
    );
  }

  const state = openState(salon.openTime, salon.closeTime, new Date(), t);
  const rating = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;
  const directions = buildDirectionsUrl(null, { latitude: Number(salon.latitude), longitude: Number(salon.longitude) });
  const image = (salon.images || [])[0];

  return (
    <div className="page !pt-8">
      <Link to="/salons" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft size={15} /> {t('salon.allSalons')}
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
              <span className="text-ink-3">{t('salon.noReviews')}</span>
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
              {t('salon.directions')} <ArrowUpRight size={15} />
            </a>
          )}
          {isCustomer && salon.ownerId && (
            <Link to={`/chat/${salon.ownerId}`} className="btn-secondary">
              {t('salon.message')}
            </Link>
          )}
        </div>
      </header>

      {image && (
        <div className="mt-8 overflow-hidden rounded-lg bg-sunken">
          <img src={image} alt={t('salon.imageAlt', { name: salon.name })} className="aspect-[21/9] w-full object-cover" />
        </div>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        <div className="min-w-0">
          {/* Menu */}
          <section aria-labelledby="menu-heading">
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <h2 id="menu-heading" className="display text-[34px] text-ink">
                {t('salon.menu')}
              </h2>
              <p className="text-sm text-ink-3">{t('salons.serviceCount', { count: services.length })}</p>
            </div>

            {services.length === 0 ? (
              <p className="py-10 text-ink-2">{t('salon.noMenu')}</p>
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
                            <p className="mt-1.5 text-[13px] text-ink-3">{formatDurationLabel(service.duration, t)}</p>
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
                              aria-label={t(active ? 'salon.removeService' : 'salon.addService', { name: service.name })}
                            >
                              {active ? (
                                <>
                                  <Check size={14} /> {t('salon.added')}
                                </>
                              ) : (
                                <>
                                  <Plus size={14} /> {t('salon.add')}
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
              {t('salon.visit')}
            </h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="eyebrow">{t('salon.address')}</dt>
                <dd className="mt-2 text-sm text-ink">{[salon.address, salon.city].filter(Boolean).join(', ')}</dd>
              </div>
              <div>
                <dt className="eyebrow">{t('salon.hours')}</dt>
                <dd className="mt-2 text-sm text-ink">
                  {t('salon.daily', { open: formatTimeLabel(salon.openTime), close: formatTimeLabel(salon.closeTime) })}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">{t('footer.contact')}</dt>
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
              {t('salon.reviews')}
            </h2>
            <div className="mt-8">
              <RatingSummary reviews={reviews} />
            </div>

            {isCustomer && !alreadyReviewed && (
              <form onSubmit={submitReview} className="mt-10 rounded-lg border border-line bg-surface p-6">
                <p className="font-semibold text-ink">{t('salon.review.prompt')}</p>
                <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label={t('salon.review.rating')}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={review.rating === n}
                      aria-label={t('salon.review.stars', { count: n })}
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
                  placeholder={t('salon.review.placeholder')}
                  value={review.text}
                  onChange={(e) => setReview((r) => ({ ...r, text: e.target.value }))}
                />
                {reviewMessage.text && (
                  <p className={`mt-3 text-sm ${reviewMessage.tone === 'error' ? 'text-danger' : 'text-success'}`}>
                    {reviewMessage.text}
                  </p>
                )}
                <button type="submit" className="btn-dark mt-4" disabled={reviewBusy}>
                  {reviewBusy ? t('salon.review.posting') : t('salon.review.submit')}
                </button>
              </form>
            )}

            <ul className="mt-10">
              {reviews.length === 0 && <li className="text-ink-2">{t('salon.review.empty')}</li>}
              {reviews.map((r) => (
                <li key={r.id} className="flex gap-4 border-b border-line py-6 last:border-0">
                  <Avatar name={r.reviewerName} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink">{r.reviewerName || t('salon.guest')}</p>
                      <p className="text-[13px] text-ink-3">
                        {r.createdAt && formatDate(r.createdAt)}
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
              <p className="eyebrow">{t('salon.book.title')}</p>
            </div>

            {!isCustomer ? (
              <p className="p-5 text-sm text-ink-2">
                {user?.role === 'SALON_OWNER' ? t('salon.book.ownerView') : t('salon.book.customersOnly')}
              </p>
            ) : booked ? (
              <div className="p-5">
                <p className="display text-[30px] text-ink">{t('salon.book.sent')}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  {t('salon.book.sentBody', {
                    date: formatDate(booked.start, { weekday: 'long', day: 'numeric', month: 'long' }),
                    time: formatTime(booked.start),
                    salon: salon.name,
                  })}
                </p>
                <div className="mt-5 flex gap-2">
                  <button type="button" className="btn-dark flex-1" onClick={() => navigate('/bookings')}>
                    {t('salon.book.view')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setBooked(null)}>
                    {t('salon.book.another')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5">
                  <p className="text-[13px] font-medium text-ink-2">1 · {t('salon.book.services')}</p>
                  {chosen.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-3">{t('salon.book.addFromMenu')}</p>
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
                              aria-label={t('salon.removeService', { name: s.name })}
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
                  <p className="text-[13px] font-medium text-ink-2">2 · {t('salon.book.day')}</p>
                  <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-thin">
                    {days.map((d) => {
                      const active = sameDay(d, day);
                      return (
                        <button
                          key={d.toISOString()}
                          type="button"
                          onClick={() => setDay(d)}
                          className={`flex min-w-[3rem] shrink-0 flex-col px-1 items-center rounded-md border py-2 transition ${
                            active ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink/40'
                          }`}
                          aria-pressed={active}
                        >
                          <span className={`text-[10.5px] uppercase tracking-wide ${active ? 'text-paper/70' : 'text-ink-3'}`}>
                            {formatDate(d, { weekday: 'short' })}
                          </span>
                          <span className="num mt-0.5 text-[17px] font-semibold">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-line p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[13px] font-medium text-ink-2">3 · {t('salon.book.time')}</p>
                    {totalMinutes > 0 && (
                      <p className="text-[12px] text-ink-3">
                        {t('salon.book.visitLength', { duration: formatDurationLabel(totalMinutes, t) })}
                      </p>
                    )}
                  </div>
                  {slots.filter((s) => !s.disabled).length === 0 ? (
                    <p className="mt-3 text-sm text-ink-3">{t('salon.book.noTimes')}</p>
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
                    <span className="text-sm text-ink-2">{t('salon.book.total')}</span>
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
                      ? t('salon.book.sending')
                      : !chosen.length
                        ? t('salon.book.needService')
                        : slot == null
                          ? t('salon.book.chooseTime')
                          : t('salon.book.request', { time: fmtMinute(slot) })}
                  </button>
                  <p className="mt-3 text-center text-[12px] text-ink-3">
                    {t('salon.book.note')}
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
                {t('salons.serviceCount', { count: chosen.length })} · {money(totalPrice)}
              </p>
              <p className="text-ink-3">{slot == null ? t('salon.book.pickDayTime') : fmtMinute(slot)}</p>
            </div>
            <a href="#book" className="btn-primary">
              {slot == null ? t('salon.book.chooseTime') : t('salon.book.review')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
