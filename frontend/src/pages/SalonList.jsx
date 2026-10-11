/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-14
 */
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LocateFixed, Map as MapIcon, Search, Star, X } from 'lucide-react';
import api from '../config/api';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import NearbySalonsMap from '../components/maps/NearbySalonsMap';
import { openState } from '../utils/time';
import { EmptyState, Notice, PageHeader } from '../components/ui';
import { useT } from '../i18n';

const getBrowserLocation = (t) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error(t('salons.err.noGeo')));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => reject(new Error(t('salons.err.geoDenied'))),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });

function SalonCard({ salon }) {
  const t = useT();
  const image = (salon.images || [])[0];
  const rating = Number(salon.averageRating || 0);
  const state = openState(salon.openTime, salon.closeTime, new Date(), t);
  const distance = Number(salon.distanceKm);

  return (
    <Link to={`/salon/${salon.id}`} className="group block focus-visible:outline-none" aria-label={salon.name}>
      <div className="relative overflow-hidden rounded-lg bg-sunken ring-offset-4 ring-offset-paper group-focus-visible:ring-2 group-focus-visible:ring-accent">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center font-display text-[56px] italic text-ink-3">
            {salon.name?.[0] || 'S'}
          </div>
        )}
        {Number.isFinite(distance) && salon.distanceKm != null && (
          <span className="num absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-[12px] font-semibold text-ink">
            {distance < 1
              ? t('salons.metres', { n: Math.round(distance * 1000) })
              : t('salons.km', { n: distance.toFixed(1) })}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-semibold leading-snug text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
          {salon.name}
        </h3>
        {rating > 0 ? (
          <span className="num flex shrink-0 items-center gap-1 text-sm font-semibold text-ink">
            <Star size={13} className="fill-gold text-gold" aria-hidden="true" />
            {rating.toFixed(1)}
            <span className="font-normal text-ink-3">({salon.reviewCount})</span>
          </span>
        ) : (
          <span className="shrink-0 text-[13px] text-ink-3">{t('salons.new')}</span>
        )}
      </div>
      <p className="mt-1 truncate text-sm text-ink-2">{[salon.address, salon.city].filter(Boolean).join(', ')}</p>
      <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-3">
        {state && (
          <span className={`flex items-center gap-1.5 ${state.open ? 'text-success' : ''}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${state.open ? 'bg-success' : 'bg-ink-3'}`} aria-hidden="true" />
            {state.label}
          </span>
        )}
        <span aria-hidden="true">·</span>
        <span>{t('salons.serviceCount', { count: salon.serviceCount || 0 })}</span>
      </p>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/3] rounded-lg" />
      <div className="skeleton mt-4 h-5 w-2/3" />
      <div className="skeleton mt-2 h-4 w-1/2" />
    </div>
  );
}

export default function SalonList() {
  const t = useT();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [openOnly, setOpenOnly] = useState(false);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState(15);
  const [showMap, setShowMap] = useState(false);
  const [activeSalonId, setActiveSalonId] = useState(null);
  const deferredQuery = useDeferredValue(query);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/salons');
      setSalons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || t('salons.err.load'));
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async (coords, radius) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/salons/nearby', {
        params: { lat: coords.latitude, lng: coords.longitude, radius },
      });
      setSalons(Array.isArray(data) ? data : []);
      setSortBy('distance');
    } catch (err) {
      setError(err?.response?.data?.error || t('salons.err.nearby'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = async () => {
    try {
      setLocating(true);
      setError('');
      const coords = await getBrowserLocation(t);
      setLocation(coords);
      await loadNearby(coords, radiusKm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setSortBy('rating');
    loadAll();
  };

  const cities = useMemo(
    () => Array.from(new Set(salons.map((s) => String(s.city || '').trim()).filter(Boolean))).sort(),
    [salons]
  );

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = salons.filter((salon) => {
      if (city && String(salon.city || '').trim() !== city) return false;
      if (openOnly && !openState(salon.openTime, salon.closeTime)?.open) return false;
      if (!q) return true;
      return [salon.name, salon.address, salon.city].some((v) => String(v || '').toLowerCase().includes(q));
    });
    const sorted = [...list];
    if (sortBy === 'name') sorted.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sortBy === 'rating')
      sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0));
    if (sortBy === 'distance') sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return sorted;
  }, [salons, deferredQuery, city, openOnly, sortBy]);

  const filtersActive = Boolean(query || city || openOnly);

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('nav.discover')}
        title={location ? t('salons.titleNear') : t('salons.title')}
        description={t('salons.description')}
      />

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            className="field pl-10"
            placeholder={t('salons.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('salons.searchLabel')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="field w-auto min-w-[9rem]" value={city} onChange={(e) => setCity(e.target.value)} aria-label={t('salons.city')}>
            <option value="">{t('salons.allCities')}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="field w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label={t('salons.sortBy')}>
            <option value="rating">{t('salons.sortRating')}</option>
            {location && <option value="distance">{t('salons.sortDistance')}</option>}
            <option value="name">{t('salons.sortName')}</option>
          </select>
          <button
            type="button"
            onClick={() => setOpenOnly((v) => !v)}
            className={`btn ${openOnly ? 'bg-ink text-paper' : 'border border-line-strong bg-surface text-ink hover:border-ink/40'}`}
            aria-pressed={openOnly}
          >
            {t('salons.openNow')}
          </button>
          {location ? (
            <button type="button" className="btn-secondary" onClick={clearLocation}>
              <X size={15} /> {t('salons.nearMe')}
            </button>
          ) : (
            <button type="button" className="btn-secondary" onClick={useMyLocation} disabled={locating}>
              <LocateFixed size={15} /> {locating ? t('salons.locating') : t('salons.nearMe')}
            </button>
          )}
          {MAPBOX_ACCESS_TOKEN && (
            <button type="button" className="btn-secondary" onClick={() => setShowMap((v) => !v)} aria-pressed={showMap}>
              <MapIcon size={15} /> {showMap ? t('salons.hideMap') : t('salons.map')}
            </button>
          )}
        </div>
      </div>

      {location && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-2">
          <span>{t('salons.within')}</span>
          {[5, 15, 30, 60].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRadiusKm(r);
                loadNearby(location, r);
              }}
              className={`rounded-full border px-3 py-1 text-[13px] ${
                radiusKm === r ? 'border-ink bg-ink text-paper' : 'border-line-strong hover:border-ink/40'
              }`}
            >
              {t('salons.km', { n: r })}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6">
          <Notice tone="error" onDismiss={() => setError('')}>
            {error}
          </Notice>
        </div>
      )}

      {showMap && MAPBOX_ACCESS_TOKEN && (
        <div className="mt-8">
          <NearbySalonsMap
            accessToken={MAPBOX_ACCESS_TOKEN}
            salons={visible}
            userLocation={location}
            activeSalonId={activeSalonId}
            onSalonSelect={(salon) => setActiveSalonId(Number(salon.id))}
          />
        </div>
      )}

      <div className="mt-10 flex items-baseline justify-between border-b border-line pb-3">
        <p className="text-sm text-ink-2">
          {loading ? t('salons.loading') : t('salons.count', { count: visible.length })}
        </p>
        {filtersActive && (
          <button
            type="button"
            className="text-sm text-ink-3 hover:text-ink"
            onClick={() => {
              setQuery('');
              setCity('');
              setOpenOnly(false);
            }}
          >
            {t('salons.clearFilters')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={salons.length ? t('salons.emptyFiltered') : t('salons.empty')}
          description={salons.length ? t('salons.emptyFilteredBody') : t('salons.emptyBody')}
        />
      ) : (
        <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((salon) => (
            <div key={salon.id} onMouseEnter={() => setActiveSalonId(Number(salon.id))}>
              <SalonCard salon={salon} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
