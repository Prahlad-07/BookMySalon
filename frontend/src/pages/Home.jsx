/**
 * @author Prahlad Yadav
 * @version 5.0
 * @since 2026-02-16
 *
 * Marketplace home: search first, then real inventory (top salons, cities, reviews)
 * pulled from the API. No invented numbers — every count on this page is live.
 */
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Check, ChevronRight, MapPin, Search, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../utils/roleRouting';
import { useCityLabel, useI18n } from '../i18n';
import { formatDate, formatNumber, formatTime, relativeDay, relativeTime } from '../i18n/format';
import { clearRecentSalons, recentSalons } from '../lib/recent';
import useApi from '../hooks/useApi';
import SalonCard, { SalonCardSkeleton } from '../components/SalonCard';
import { Avatar, Stars, StatusTag } from '../components/ui';
import { sized, srcSetFor } from '../lib/images';
import { BRIDAL_IMAGE, CATEGORIES, CITY_IMAGES, MEHENDI_IMAGE, POPULAR_SEARCHES } from '../lib/catalog';
import studioImage from '../assets/owner-studio.jpg';
import SafeImage from '../components/SafeImage';

function SectionHead({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="h-section">{title}</h2>
        {subtitle && <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function SeeAll({ to, label }) {
  return (
    <Link to={to} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-ink hover:text-accent sm:inline-flex">
      {label} <ChevronRight size={16} />
    </Link>
  );
}

function HeroSearch({ cities }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const cityLabel = useCityLabel();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');

  const go = (query = q, c = city) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (c) params.set('city', c);
    navigate(`/salons${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-bar sm:flex-row sm:items-center sm:gap-0 sm:rounded-full"
        role="search"
      >
        <label className="flex flex-1 items-center gap-2.5 px-3 sm:px-4">
          <Search size={18} className="shrink-0 text-ink-3" aria-hidden="true" />
          <span className="sr-only">{t('h.searchLabel')}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('h.searchPlaceholder')}
            className="h-11 w-full bg-transparent text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </label>
        <span className="hidden h-7 w-px bg-line sm:block" aria-hidden="true" />
        <label className="flex items-center gap-2 px-3 sm:w-48 sm:px-4">
          <MapPin size={17} className="shrink-0 text-ink-3" aria-hidden="true" />
          <span className="sr-only">{t('salons.city')}</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-11 w-full cursor-pointer appearance-none bg-transparent text-[15px] text-ink focus:outline-none"
          >
            <option value="">{t('salons.allCities')}</option>
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {cityLabel(c.city)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary h-12 rounded-xl px-7 sm:rounded-full">
          {t('h.search')}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[13.5px]">
        <span className="text-ink-3">{t('h.popular')}</span>
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => go(term, city)}
            className="rounded-full bg-sunken px-3 py-1.5 font-medium text-ink-2 transition-colors hover:bg-line hover:text-ink"
          >
            {t(`h.term.${term}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function HeroMosaic({ salons }) {
  const cityLabel = useCityLabel();
  const picks = salons.filter((s) => s.images?.length).slice(0, 3);
  if (picks.length < 3) {
    return <div className="hidden aspect-[5/4] rounded-2xl bg-sunken lg:block" aria-hidden="true" />;
  }
  const Tile = ({ salon, className, w, ratio }) => (
    <Link to={`/salon/${salon.id}`} className={`group relative block overflow-hidden rounded-2xl bg-sunken ${className}`}>
      <SafeImage
        src={sized(salon.images[0], w, Math.round(w * ratio))}
        srcSet={srcSetFor(salon.images[0], w, ratio)}
        sizes={`${w}px`}
        alt=""
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-full bg-white/95 px-3 py-1.5 text-[12.5px] font-semibold text-[#18181b] shadow-sm">
        {salon.name} · {cityLabel(salon.city)}
      </span>
    </Link>
  );
  return (
    <div className="hidden h-[460px] grid-cols-[1.15fr_1fr] grid-rows-2 gap-3 lg:grid">
      <Tile salon={picks[0]} className="row-span-2" w={360} ratio={1.28} />
      <Tile salon={picks[1]} w={300} ratio={0.75} />
      <Tile salon={picks[2]} w={300} ratio={0.75} />
    </div>
  );
}

function CityTabs({ cities, value, onChange }) {
  const { t } = useI18n();
  const cityLabel = useCityLabel();
  return (
    <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:px-0">
      <button type="button" className="chip" aria-pressed={!value} onClick={() => onChange('')}>
        {t('h.allIndia')}
      </button>
      {cities.slice(0, 6).map((c) => (
        <button key={c.city} type="button" className="chip" aria-pressed={value === c.city} onClick={() => onChange(c.city)}>
          {cityLabel(c.city)}
        </button>
      ))}
    </div>
  );
}

function CardRail({ items, loading }) {
  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {loading
        ? [0, 1, 2, 3].map((i) => <SalonCardSkeleton key={i} className="w-[78%] shrink-0 snap-start sm:w-auto" />)
        : items.map((salon) => (
            <SalonCard key={salon.id} salon={salon} width={300} className="w-[78%] shrink-0 snap-start sm:w-auto" />
          ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const { t } = useI18n();
  const cityLabel = useCityLabel();
  return (
    <figure className="flex h-full flex-col rounded-xl border border-line bg-surface p-5">
      <Stars value={review.rating} size={14} />
      <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">“{review.text}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <Avatar name={review.reviewerName} size={34} />
        <span className="min-w-0 text-[13.5px]">
          <span className="block font-semibold text-ink">{review.reviewerName}</span>
          <Link to={`/salon/${review.salonId}`} className="block truncate text-ink-3 hover:text-ink">
            {t('h.reviewAt', { salon: review.salonName, city: cityLabel(review.salonCity) })} · {relativeTime(review.createdAt)}
          </Link>
        </span>
      </figcaption>
    </figure>
  );
}

/** For signed-in customers: their next visit, one tap from the home page. */
function NextVisit({ user }) {
  const { t } = useI18n();
  const isCustomer = user?.role === 'CUSTOMER';
  const { data } = useApi(isCustomer ? `/api/bookings/user/${user.id}` : null, null, { ttl: 30_000 });
  const next = (data || [])
    .filter((b) => (b.status === 'PENDING' || b.status === 'CONFIRMED') && new Date(b.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
  if (!next) return null;
  const start = new Date(next.startTime);
  return (
    <section className="shell pb-10">
      <Link
        to="/bookings"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface p-4 shadow-lift transition hover:border-line-strong sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <CalendarCheck size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-ink-3">{t('h.next.title')}</span>
          <span className="block truncate text-[15.5px] font-semibold text-ink">
            {next.salonName} · {relativeDay(start) || formatDate(start, { weekday: 'short', day: 'numeric', month: 'short' })},{' '}
            {formatTime(start)}
          </span>
        </span>
        <StatusTag status={next.status} />
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
          {t('h.next.view')} <ChevronRight size={16} />
        </span>
      </Link>
    </section>
  );
}

function RecentlyViewed() {
  const { t } = useI18n();
  const [items, setItems] = useState(() => recentSalons());
  if (items.length < 2) return null;
  return (
    <section className="shell pb-14 lg:pb-20">
      <SectionHead
        title={t('h.recent.title')}
        action={
          <button
            type="button"
            className="text-sm font-medium text-ink-3 hover:text-ink"
            onClick={() => {
              clearRecentSalons();
              setItems([]);
            }}
          >
            {t('h.recent.clear')}
          </button>
        }
      />
      <CardRail items={items.slice(0, 4)} loading={false} />
    </section>
  );
}

function LanguageStrip() {
  const { t, language, setLanguage, languages } = useI18n();
  return (
    <section className="border-t border-line bg-sunken/60">
      <div className="shell flex flex-col gap-5 py-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{t('h.lang.title')}</h2>
          <p className="mt-1 text-[14.5px] text-ink-2">{t('h.lang.body')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              className="chip"
              aria-pressed={l.code === language}
              onClick={() => setLanguage(l.code)}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();
  const cityLabel = useCityLabel();
  const [topCity, setTopCity] = useState('');

  const insights = useApi('/api/salons/insights', null, { ttl: 300_000 });
  const featured = useApi('/api/salons/search', { size: 8, sort: 'rating' });
  const top = useApi('/api/salons/search', topCity ? { size: 8, sort: 'rating', city: topCity } : { size: 8, sort: 'rating' });
  const fresh = useApi('/api/salons/search', { size: 4, sort: 'newest' });
  const reviews = useApi('/api/reviews/recent', { limit: 6 }, { ttl: 300_000 });

  const stats = insights.data;
  const cities = useMemo(() => stats?.topCities || [], [stats]);
  const ownerPath = user ? getDashboardPathByRole(user.role) : '/signup';

  return (
    <div>
      {/* Hero */}
      <section className="shell grid items-center gap-10 pb-14 pt-8 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-20 lg:pt-14">
        <div className="animate-fade">
          <h1 className="display max-w-[15ch] text-[38px] text-ink sm:text-[52px] lg:text-[58px]">{t('h.title')}</h1>
          <p className="lede mt-4 max-w-[34rem]">
            {stats
              ? t('h.sub', { salons: formatNumber(stats.salons), cities: formatNumber(stats.cities) })
              : t('h.subFallback')}
          </p>
          <div className="mt-8">
            <HeroSearch cities={cities} />
          </div>
          {stats && stats.reviews > 0 && (
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[14px] text-ink-2">
              <div className="flex items-center gap-1.5">
                <Star size={15} className="fill-gold text-gold" aria-hidden="true" />
                <dt className="sr-only">{t('h.stat.rating')}</dt>
                <dd>
                  <span className="num font-semibold text-ink">{stats.averageRating.toFixed(1)}</span> {t('h.stat.ratingNote')}
                </dd>
              </div>
              <div>
                <dt className="sr-only">{t('h.stat.reviews')}</dt>
                <dd>{t('h.stat.reviewsValue', { count: stats.reviews, n: formatNumber(stats.reviews) })}</dd>
              </div>
              <div>
                <dt className="sr-only">{t('h.stat.cities')}</dt>
                <dd>{t('h.stat.citiesValue', { n: formatNumber(stats.cities) })}</dd>
              </div>
            </dl>
          )}
        </div>
        <HeroMosaic salons={featured.data?.items || []} />
      </section>

      <NextVisit user={user} />

      {/* Categories */}
      <section className="shell pb-14 lg:pb-20">
        <SectionHead title={t('h.cat.title')} />
        <ul className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-8">
          {CATEGORIES.map((c) => (
            <li key={c.key} className="w-[110px] shrink-0 sm:w-auto">
              <Link to={`/salons?q=${encodeURIComponent(c.q)}`} className="group block">
                <div className="overflow-hidden rounded-xl bg-sunken">
                  <SafeImage
                    src={sized(c.image, 220, 220)}
                    srcSet={srcSetFor(c.image, 160, 1)}
                    sizes="160px"
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-[14px] font-semibold text-ink">{t(`h.cat.${c.key}`)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <RecentlyViewed />

      {/* Top rated */}
      <section className="shell pb-14 lg:pb-20">
        <SectionHead
          title={topCity ? t('h.top.titleCity', { city: cityLabel(topCity) }) : t('h.top.title')}
          subtitle={t('h.top.subtitle')}
          action={<SeeAll to={`/salons${topCity ? `?city=${encodeURIComponent(topCity)}` : ''}`} label={t('h.seeAll')} />}
        />
        <CityTabs cities={cities} value={topCity} onChange={setTopCity} />
        <CardRail items={top.data?.items?.slice(0, 4) || []} loading={top.loading && !top.data} />
      </section>

      {/* Cities */}
      {cities.length > 0 && (
        <section className="shell pb-14 lg:pb-20">
          <SectionHead title={t('h.cities.title')} subtitle={t('h.cities.subtitle')} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cities.slice(0, 10).map((c) => (
              <li key={c.city}>
                <Link
                  to={`/salons?city=${encodeURIComponent(c.city)}`}
                  className="group relative block overflow-hidden rounded-xl bg-sunken"
                >
                  {CITY_IMAGES[c.city] && (
                    <SafeImage
                      src={sized(CITY_IMAGES[c.city], 320, 240)}
                      srcSet={srcSetFor(CITY_IMAGES[c.city], 240, 0.75)}
                      sizes="240px"
                      alt=""
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-white">
                    <span className="block text-[16px] font-semibold leading-tight">{cityLabel(c.city)}</span>
                    <span className="block text-[12.5px] text-white/80">{t('salons.count', { count: c.salons })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Wedding season */}
      <section className="shell pb-14 lg:pb-20">
        <div className="grid overflow-hidden rounded-2xl bg-[#2a0f18] text-white lg:grid-cols-2">
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
            <p className="text-[13px] font-semibold text-[#f6a7bb]">{t('h.bridal.eyebrow')}</p>
            <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">{t('h.bridal.title')}</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75">{t('h.bridal.body')}</p>
            <ul className="mt-6 space-y-2 text-[14.5px] text-white/85">
              {['makeup', 'artists', 'trial'].map((k) => (
                <li key={k} className="flex items-center gap-2.5">
                  <Check size={16} className="text-[#f6a7bb]" aria-hidden="true" /> {t(`h.bridal.${k}`)}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/salons?q=bridal" className="btn btn-lg bg-white text-[#2a0f18] hover:bg-white/90">
                {t('h.bridal.cta')} <ArrowRight size={17} />
              </Link>
              <Link to="/salons?q=mehendi" className="btn btn-lg text-white ring-1 ring-white/30 hover:bg-white/10">
                {t('h.bridal.mehendi')}
              </Link>
            </div>
          </div>
          <div className="grid min-h-[280px] grid-cols-2">
            <SafeImage src={sized(BRIDAL_IMAGE, 480, 640)} alt="" loading="lazy" className="h-full w-full object-cover" />
            <SafeImage src={sized(MEHENDI_IMAGE, 480, 640)} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.data?.length > 0 && (
        <section className="shell pb-14 lg:pb-20">
          <SectionHead title={t('h.reviews.title')} subtitle={t('h.reviews.subtitle')} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.data.slice(0, 6).map((r, i) => (
              <li key={r.id} className={i >= 3 ? 'hidden sm:block' : ''}>
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* New */}
      {fresh.data?.items?.length > 0 && (
        <section className="shell pb-14 lg:pb-20">
          <SectionHead
            title={t('h.new.title')}
            subtitle={t('h.new.subtitle')}
            action={<SeeAll to="/salons?sort=newest" label={t('h.seeAll')} />}
          />
          <CardRail items={fresh.data.items} loading={false} />
        </section>
      )}

      {/* Owners */}
      <section className="shell pb-16 lg:pb-24">
        <div className="grid items-center gap-10 rounded-2xl border border-line bg-sunken/70 p-7 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:p-12">
          <div>
            <p className="eyebrow">{t('h.owner.eyebrow')}</p>
            <h2 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[34px]">
              {t('h.owner.title')}
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">{t('h.owner.body')}</p>
            <ul className="mt-6 space-y-3 text-[14.5px] text-ink">
              {['menu', 'calendar', 'chat', 'insights'].map((k) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                  </span>
                  {t(`h.owner.${k}`)}
                </li>
              ))}
            </ul>
            <Link to={ownerPath} className="btn-dark btn-lg mt-8">
              {user ? t('home.owner.go') : t('h.owner.cta')} <ArrowRight size={17} />
            </Link>
          </div>
          <SafeImage
            src={studioImage}
            alt={t('home.owner.imageAlt')}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
        </div>
      </section>

      <LanguageStrip />
    </div>
  );
}
