/**
 * @author Prahlad Yadav
 * @version 4.0
 * @since 2026-02-14
 *
 * Public salon search. Filters live in the URL (shareable, back-button friendly);
 * results are paged server-side, so the page stays fast whatever the catalogue size.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LocateFixed, Map as MapIcon, Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../config/api';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import NearbySalonsMap from '../components/maps/NearbySalonsMap';
import SalonCard, { SalonCardSkeleton } from '../components/SalonCard';
import { EmptyState, Notice } from '../components/ui';
import useApi from '../hooks/useApi';
import { useCityLabel, useT } from '../i18n';
import { formatNumber, money } from '../i18n/format';
import { POPULAR_SEARCHES } from '../lib/catalog';

const PAGE_SIZE = 12;
const PRICE_CAPS = [500, 1000, 2500];

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

export default function SalonList() {
  const t = useT();
  const cityLabel = useCityLabel();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const city = params.get('city') || '';
  const sort = params.get('sort') || 'rating';
  const open = params.get('open') === '1';
  const minRating = Number(params.get('rating')) || 0;
  const maxPrice = Number(params.get('price')) || 0;

  const [draft, setDraft] = useState(q);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState(15);
  const [showMap, setShowMap] = useState(false);
  const [activeSalonId, setActiveSalonId] = useState(null);
  const controller = useRef(null);

  const insights = useApi('/api/salons/insights', null, { ttl: 300_000 });
  const cities = insights.data?.topCities || [];

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null || v === false || v === 0) next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  // Keep the box in sync when the URL changes (back button, category links).
  useEffect(() => setDraft(q), [q]);

  // Debounce typing into the URL.
  useEffect(() => {
    if (draft === q) return undefined;
    const id = setTimeout(() => update({ q: draft.trim() }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const query = useMemo(
    () => ({
      ...(q && { q }),
      ...(city && { city }),
      ...(open && { openNow: true }),
      ...(minRating && { minRating }),
      ...(maxPrice && { maxPrice }),
      sort,
      size: PAGE_SIZE,
    }),
    [q, city, open, minRating, maxPrice, sort]
  );

  const fetchPage = async (pageIndex, append) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');
      const data = await api.get('/api/salons/search', { params: { ...query, page: pageIndex }, signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setItems((prev) => (append ? [...prev, ...(data.items || [])] : data.items || []));
      setPage(pageIndex);
      setTotal(data.totalItems ?? 0);
      setHasNext(Boolean(data.hasNext));
    } catch (err) {
      if (!ctrl.signal.aborted) setError(err?.response?.data?.error || t('salons.err.load'));
    } finally {
      if (!ctrl.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const loadNearby = async (coords, radius) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/salons/nearby', {
        params: { lat: coords.latitude, lng: coords.longitude, radius },
      });
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      setTotal(list.length);
      setHasNext(false);
    } catch (err) {
      setError(err?.response?.data?.error || t('salons.err.nearby'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) return undefined;
    fetchPage(0, false);
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, location]);

  const useMyLocation = async () => {
    try {
      setLocating(true);
      const coords = await getBrowserLocation(t);
      setLocation(coords);
      await loadNearby(coords, radiusKm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const filtersActive = Boolean(q || city || open || minRating || maxPrice);
  const clearAll = () => {
    setDraft('');
    setParams(sort !== 'rating' ? { sort } : {}, { replace: true });
  };

  const title = location
    ? t('salons.titleNear')
    : q
      ? t('list.resultsFor', { q })
      : city
        ? t('list.inCity', { city: cityLabel(city) })
        : t('salons.title');

  return (
    <div className="shell pb-24 pt-6 sm:pt-8">
      <h1 className="display text-[26px] text-ink sm:text-[32px]">{title}</h1>
      <p className="mt-1 text-[14.5px] text-ink-2">
        {loading && total == null ? t('salons.loading') : t('salons.count', { count: total || 0 })}
        {!location && insights.data && !filtersActive && (
          <> · {t('h.stat.citiesValue', { n: formatNumber(insights.data.cities) })}</>
        )}
      </p>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-5 mt-5 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur-md sm:mx-0 sm:px-0">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <span className="sr-only">{t('salons.searchLabel')}</span>
            <input
              className="field h-11 rounded-full pl-10 pr-10"
              placeholder={t('h.searchPlaceholder')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={Boolean(location)}
            />
            {draft && (
              <button
                type="button"
                className="icon-btn absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={() => setDraft('')}
                aria-label={t('salons.clearFilters')}
              >
                <X size={15} />
              </button>
            )}
          </label>
          <div className="flex gap-2">
            <select
              className="field h-11 w-auto min-w-0 flex-1 rounded-full sm:min-w-[9.5rem] sm:flex-none"
              value={city}
              onChange={(e) => update({ city: e.target.value })}
              aria-label={t('salons.city')}
              disabled={Boolean(location)}
            >
              <option value="">{t('salons.allCities')}</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  {cityLabel(c.city)} ({c.salons})
                </option>
              ))}
            </select>
            <select
              className="field h-11 w-auto min-w-0 flex-1 rounded-full sm:flex-none"
              value={sort}
              onChange={(e) => update({ sort: e.target.value === 'rating' ? '' : e.target.value })}
              aria-label={t('salons.sortBy')}
              disabled={Boolean(location)}
            >
              <option value="rating">{t('salons.sortRating')}</option>
              <option value="reviews">{t('list.sortReviews')}</option>
              <option value="price">{t('list.sortPrice')}</option>
              <option value="newest">{t('list.sortNewest')}</option>
              <option value="name">{t('salons.sortName')}</option>
            </select>
          </div>
        </div>

        <div className="-mx-5 mt-2.5 flex items-center gap-2 overflow-x-auto px-5 pb-0.5 no-scrollbar sm:mx-0 sm:px-0">
          <SlidersHorizontal size={16} className="shrink-0 text-ink-3" aria-hidden="true" />
          {location ? (
            <>
              <button type="button" className="chip chip-active" onClick={() => setLocation(null)}>
                <X size={14} /> {t('salons.nearMe')}
              </button>
              {[5, 15, 30, 60].map((r) => (
                <button
                  key={r}
                  type="button"
                  className="chip"
                  aria-pressed={radiusKm === r}
                  onClick={() => {
                    setRadiusKm(r);
                    loadNearby(location, r);
                  }}
                >
                  {t('salons.km', { n: r })}
                </button>
              ))}
            </>
          ) : (
            <>
              <button type="button" className="chip" aria-pressed={open} onClick={() => update({ open: open ? '' : '1' })}>
                {t('salons.openNow')}
              </button>
              <button
                type="button"
                className="chip"
                aria-pressed={minRating >= 4}
                onClick={() => update({ rating: minRating >= 4 ? '' : 4 })}
              >
                {t('list.rated4')}
              </button>
              {PRICE_CAPS.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  className="chip"
                  aria-pressed={maxPrice === cap}
                  onClick={() => update({ price: maxPrice === cap ? '' : cap })}
                >
                  {t('list.under', { price: money(cap) })}
                </button>
              ))}
              <button type="button" className="chip" onClick={useMyLocation} disabled={locating}>
                <LocateFixed size={14} /> {locating ? t('salons.locating') : t('salons.nearMe')}
              </button>
            </>
          )}
          {MAPBOX_ACCESS_TOKEN && (
            <button type="button" className="chip" aria-pressed={showMap} onClick={() => setShowMap((v) => !v)}>
              <MapIcon size={14} /> {showMap ? t('salons.hideMap') : t('salons.map')}
            </button>
          )}
          {filtersActive && !location && (
            <button
              type="button"
              className="ml-1 shrink-0 text-[13.5px] font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline"
              onClick={clearAll}
            >
              {t('salons.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6">
          <Notice tone="error" onDismiss={() => setError('')}>
            {error}
          </Notice>
        </div>
      )}

      {showMap && MAPBOX_ACCESS_TOKEN && (
        <div className="mt-6">
          <NearbySalonsMap
            accessToken={MAPBOX_ACCESS_TOKEN}
            salons={items}
            userLocation={location}
            activeSalonId={activeSalonId}
            onSalonSelect={(salon) => setActiveSalonId(Number(salon.id))}
          />
        </div>
      )}

      {loading ? (
        <div className="mt-7 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <SalonCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-8"
          title={filtersActive || location ? t('salons.emptyFiltered') : t('salons.empty')}
          description={filtersActive || location ? t('salons.emptyFilteredBody') : t('salons.emptyBody')}
          action={
            filtersActive && (
              <div className="flex flex-col items-center gap-5">
                <button type="button" className="btn-secondary" onClick={clearAll}>
                  {t('salons.clearFilters')}
                </button>
                <div className="flex max-w-lg flex-wrap justify-center gap-2">
                  <span className="w-full text-[13px] text-ink-3">{t('list.tryInstead')}</span>
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setDraft(term);
                        setParams({ q: term }, { replace: true });
                      }}
                    >
                      {t(`h.term.${term}`)}
                    </button>
                  ))}
                  {cities.slice(0, 4).map((c) => (
                    <button key={c.city} type="button" className="chip" onClick={() => setParams({ city: c.city }, { replace: true })}>
                      {cityLabel(c.city)}
                    </button>
                  ))}
                </div>
              </div>
            )
          }
        />
      ) : (
        <>
          <div className="mt-7 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((salon) => (
              <SalonCard key={salon.id} salon={salon} width={300} onHover={() => setActiveSalonId(Number(salon.id))} />
            ))}
          </div>
          {hasNext && (
            <div className="mt-12 flex flex-col items-center gap-2">
              <p className="text-[13px] text-ink-3">{t('list.showing', { shown: items.length, total })}</p>
              <button
                type="button"
                className="btn-secondary btn-lg min-w-[12rem]"
                onClick={() => fetchPage(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? `${t('common.loading')}…` : t('list.more')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
