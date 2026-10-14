/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-14
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, CalendarPlus, Check, CheckCircle2, ChevronRight, MapPin, Minus, Phone, Plus, Share2, Star } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { buildDirectionsUrl } from '../config/mapbox';
import { formatDurationLabel, formatTimeLabel, openState, toMinuteOfDay } from '../utils/time';
import { Avatar, EmptyState, Notice, PageLoader, Stars, money } from '../components/ui';
import { useCityLabel, useT } from '../i18n';
import Gallery from '../components/Gallery';
import useApi from '../hooks/useApi';
import { formatDate, formatTime, relativeDay } from '../i18n/format';
import { downloadIcs } from '../lib/ics';
import { rememberSalon } from '../lib/recent';

const SLOT_STEP_MIN = 30;
const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';
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
        <p className="num text-[48px] font-semibold leading-none tracking-[-0.03em] text-ink">{total ? avg.toFixed(1) : '—'}</p>
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
  const { user, login } = useAuth();
  const t = useT();
  const [demoSigningIn, setDemoSigningIn] = useState(false);
  const cityLabel = useCityLabel();
  const routerLocation = useLocation();
  const [menuFilter, setMenuFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
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
      rememberSalon(salonData);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      setLoadError(err?.response?.status === 404 ? 'missing' : extractError(err, t('salon.err.load')));
    } finally {
      setLoading(false);
    }
    // Refetch per salon only — switching language must not reload the page data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const dayKey = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
  const busy = useApi(isCustomer ? `/api/bookings/salon/${salonId}/busy` : null, { date: dayKey }, { ttl: 15_000 });
  const busyRanges = useMemo(
    () =>
      (busy.data || []).map((b) => {
        const s0 = new Date(b.start);
        const e0 = new Date(b.end);
        const sameAsDay = (d) => d.toDateString() === day.toDateString();
        return [sameAsDay(s0) ? s0.getHours() * 60 + s0.getMinutes() : 0, sameAsDay(e0) ? e0.getHours() * 60 + e0.getMinutes() : 24 * 60];
      }),
    [busy.data, day]
  );

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
      // Taken if this visit would overlap an existing booking.
      const taken = busyRanges.some(([bs, be]) => m < be && m + duration > bs);
      list.push({ minute: m, disabled: m < earliest || taken });
    }
    return list;
  }, [salon, day, totalMinutes, busyRanges]);

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
      busy.reload();
    } catch (err) {
      const message = extractError(err, t('salon.err.book'));
      const taken = err?.response?.status === 409 || /already booked|overlap/i.test(message);
      setBookingError(taken ? t('salon.err.taken') : message);
      if (taken) busy.reload();
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
          as="h1"
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

  return (
    <div className="shell pb-24 pt-5 sm:pt-6">
      <nav aria-label={t('salon.breadcrumb')} className="flex items-center gap-1 text-[13.5px] text-ink-3">
        <Link to="/salons" className="hover:text-ink">
          {t('salon.allSalons')}
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link to={`/salons?city=${encodeURIComponent(salon.city || '')}`} className="hover:text-ink">
          {cityLabel(salon.city)}
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="truncate text-ink-2">{salon.name}</span>
      </nav>

      <header className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="display text-[28px] text-ink sm:text-[36px]">{salon.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-ink-2">
            {reviews.length > 0 ? (
              <a href="#reviews" className="flex items-center gap-1.5 font-medium text-ink hover:underline">
                <Star size={15} className="fill-gold text-gold" aria-hidden="true" />
                <span className="num font-semibold">{rating.toFixed(1)}</span>
                <span className="text-ink-2 underline decoration-line-strong underline-offset-4">
                  {t('salon.reviewCount', { count: reviews.length })}
                </span>
              </a>
            ) : (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-semibold text-accent">{t('salons.new')}</span>
            )}
            <span aria-hidden="true" className="text-line-strong">·</span>
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-ink-3" aria-hidden="true" />
              {[salon.address, cityLabel(salon.city)].filter(Boolean).join(', ')}
            </span>
            {state && (
              <>
                <span aria-hidden="true" className="text-line-strong">·</span>
                <span className={`font-medium ${state.open ? 'text-success' : 'text-ink-2'}`}>{state.label}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={async () => {
              const url = window.location.href;
              try {
                if (navigator.share) await navigator.share({ title: salon.name, url });
                else {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }
              } catch {
                /* share sheet dismissed */
              }
            }}
          >
            <Share2 size={14} /> {copied ? t('salon.copied') : t('salon.share')}
          </button>
          {directions && (
            <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
              {t('salon.directions')} <ArrowUpRight size={14} />
            </a>
          )}
          {isCustomer && salon.ownerId && (
            <Link to={`/chat/${salon.ownerId}`} className="btn-secondary btn-sm">
              {t('salon.message')}
            </Link>
          )}
        </div>
      </header>

      <div className="mt-5">
        <Gallery images={salon.images || []} name={salon.name} />
      </div>

      <nav
        aria-label={t('salon.sections')}
        className="sticky top-16 z-20 -mx-5 mt-6 flex gap-6 border-b border-line bg-paper/95 px-5 text-[14.5px] font-medium backdrop-blur-md sm:mx-0 sm:px-0"
      >
        {[
          ['#menu', t('salon.menu')],
          ['#reviews', t('salon.reviews')],
          ['#about', t('salon.visit')],
        ].map(([href, label]) => (
          <a key={href} href={href} className="-mb-px border-b-2 border-transparent py-3 text-ink-2 hover:border-ink hover:text-ink">
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <div className="min-w-0">
          {/* Menu */}
          <section id="menu" className="scroll-mt-32" aria-labelledby="menu-heading">
            <div className="flex items-baseline justify-between">
              <h2 id="menu-heading" className="h-section">
                {t('salon.menu')}
              </h2>
              <p className="text-sm text-ink-3">{t('salons.serviceCount', { count: services.length })}</p>
            </div>
            {groupedServices.length > 1 && (
              <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 no-scrollbar sm:mx-0 sm:px-0">
                <button type="button" className="chip" aria-pressed={!menuFilter} onClick={() => setMenuFilter('')}>
                  {t('salon.allServices')}
                </button>
                {groupedServices.map(([group]) => (
                  <button key={group} type="button" className="chip" aria-pressed={menuFilter === group} onClick={() => setMenuFilter(group)}>
                    {group}
                  </button>
                ))}
              </div>
            )}

            {services.length === 0 ? (
              <p className="py-10 text-ink-2">{t('salon.noMenu')}</p>
            ) : (
              groupedServices.filter(([group]) => !menuFilter || group === menuFilter).map(([group, items]) => (
                <div key={group} className="mt-7">
                  <p className="mb-1 text-[15px] font-semibold text-ink">{group}</p>
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
          <section id="about" className="mt-14 scroll-mt-32" aria-labelledby="about-heading">
            <h2 id="about-heading" className="h-section">
              {t('salon.visit')}
            </h2>
            {salon.description && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{salon.description}</p>}
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
          <section id="reviews" className="mt-14 scroll-mt-32" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="h-section">
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
              {(allReviews ? reviews : reviews.slice(0, 6)).map((r) => (
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
            {!allReviews && reviews.length > 6 && (
              <button type="button" className="btn-secondary mt-2" onClick={() => setAllReviews(true)}>
                {t('salon.review.showAll', { count: reviews.length })}
              </button>
            )}
          </section>
        </div>

        {/* Booking panel */}
        <aside id="book" className="min-w-0 scroll-mt-32 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border border-line bg-surface shadow-lift">
            <div className="border-b border-line p-5">
              <p className="eyebrow">{t('salon.book.title')}</p>
            </div>

            {!user ? (
              <div className="p-5">
                {salon.minPrice != null && (
                  <p className="text-[14px] text-ink-2">
                    {t('card.from')} <span className="num text-[22px] font-semibold text-ink">{money(salon.minPrice)}</span>
                  </p>
                )}
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{t('salon.book.signInBody')}</p>
                <Link to="/login" state={{ from: routerLocation.pathname }} className="btn-primary btn-lg mt-4 w-full">
                  {t('salon.book.signIn')}
                </Link>
                {SHOW_DEMO_ACCOUNTS && (
                  <button
                    type="button"
                    className="btn-secondary mt-2 w-full"
                    disabled={demoSigningIn}
                    onClick={async () => {
                      setDemoSigningIn(true);
                      await login('customer.test@gmail.com', 'Test@12345');
                      setDemoSigningIn(false);
                    }}
                  >
                    {demoSigningIn ? t('login.signingIn') : t('salon.book.tryDemo')}
                  </button>
                )}
                <Link to="/signup" className="btn-ghost mt-1 w-full">
                  {t('login.createAccount')}
                </Link>
              </div>
            ) : !isCustomer ? (
              <p className="p-5 text-sm text-ink-2">
                {user?.role === 'SALON_OWNER' ? t('salon.book.ownerView') : t('salon.book.customersOnly')}
              </p>
            ) : booked ? (
              <div className="animate-fade p-5">
                <CheckCircle2 size={34} className="text-success" aria-hidden="true" />
                <p className="mt-3 text-[20px] font-semibold tracking-[-0.01em] text-ink">{t('salon.book.sent')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                  {t('salon.book.sentBody', {
                    date: formatDate(booked.start, { weekday: 'long', day: 'numeric', month: 'long' }),
                    time: formatTime(booked.start),
                    salon: salon.name,
                  })}
                </p>
                <dl className="mt-4 space-y-1.5 rounded-xl bg-sunken p-4 text-[13.5px]">
                  {(booked.serviceNames || []).map((n) => (
                    <div key={n} className="flex justify-between gap-3">
                      <dt className="text-ink-2">{n}</dt>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 border-t border-line pt-2 font-semibold text-ink">
                    <dt>{t('salon.book.total')}</dt>
                    <dd className="num">{money(booked.totalPrice)}</dd>
                  </div>
                </dl>
                <div className="mt-4 grid gap-2">
                  <button type="button" className="btn-dark" onClick={() => navigate('/bookings')}>
                    {t('salon.book.view')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      downloadIcs({
                        uid: booked.id,
                        title: `${salon.name} — ${(booked.serviceNames || []).join(', ')}`,
                        start: booked.start,
                        end: new Date(booked.endTime || booked.start.getTime() + 3600000),
                        location: [salon.address, salon.city].filter(Boolean).join(', '),
                        description: t('salon.book.calendarNote'),
                      })
                    }
                  >
                    <CalendarPlus size={16} /> {t('salon.book.addCalendar')}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setBooked(null)}>
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
                          className={`flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-lg border px-1.5 py-2 transition ${
                            active ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink/40'
                          }`}
                          aria-pressed={active}
                        >
                          <span className={`max-w-[4.5rem] truncate text-[10.5px] font-medium ${active ? 'text-paper/75' : 'text-ink-3'}`}>
                            {days.indexOf(d) < 2 ? relativeDay(d) : formatDate(d, { weekday: 'short' })}
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
                    <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
                      {[
                        ['morning', (m) => m < 12 * 60],
                        ['afternoon', (m) => m >= 12 * 60 && m < 17 * 60],
                        ['evening', (m) => m >= 17 * 60],
                      ].map(([part, inPart]) => {
                        const group = slots.filter((s) => inPart(s.minute));
                        if (!group.some((s) => !s.disabled)) return null;
                        return (
                          <div key={part}>
                            <p className="mb-1.5 text-[12px] font-medium text-ink-3">{t(`salon.book.${part}`)}</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {group.map((s) => (
                                <button
                                  key={s.minute}
                                  type="button"
                                  disabled={s.disabled}
                                  onClick={() => setSlot(s.minute)}
                                  aria-pressed={slot === s.minute}
                                  className={`num h-9 rounded-lg border text-[13px] font-medium transition disabled:cursor-not-allowed disabled:border-transparent disabled:bg-sunken/60 disabled:text-ink-3/50 disabled:line-through ${
                                    slot === s.minute ? 'border-accent bg-accent text-accent-ink' : 'border-line hover:border-ink/40'
                                  }`}
                                >
                                  {fmtMinute(s.minute)}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-line p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ink-2">{t('salon.book.total')}</span>
                    <span className="num text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink">{money(totalPrice)}</span>
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
                  <ul className="mt-4 space-y-1.5 text-[12.5px] text-ink-2">
                    {['freeCancel', 'noPrepay', 'confirmNote'].map((k) => (
                      <li key={k} className="flex items-start gap-2">
                        <Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                        {t(`salon.book.${k}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {!user && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink-2">
              {salon.minPrice != null && (
                <>
                  {t('card.from')} <span className="num font-semibold text-ink">{money(salon.minPrice)}</span>
                </>
              )}
            </p>
            <Link to="/login" state={{ from: routerLocation.pathname }} className="btn-primary">
              {t('salon.book.signIn')}
            </Link>
          </div>
        </div>
      )}

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
