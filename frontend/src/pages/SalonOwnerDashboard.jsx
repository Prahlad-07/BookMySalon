/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-14
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, LocateFixed, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../config/api';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import MapboxLocationPicker from '../components/maps/MapboxLocationPicker';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { EmptyState, Field, Notice, PageLoader, Stat, StatusTag, money } from '../components/ui';
import { formatDurationLabel, toMinuteOfDay, toTimeInputValue } from '../utils/time';
import { useT } from '../i18n';
import { formatDate, formatNumber, formatTime, statMoney } from '../i18n/format';

/* ------------------------------------------------------------------ helpers */

const emptyServiceForm = { name: '', description: '', price: '', duration: '30', categoryId: '' };
const emptySalonForm = {
  name: '',
  address: '',
  city: '',
  phoneNumber: '',
  email: '',
  openTime: '09:00',
  closeTime: '18:00',
  latitude: '',
  longitude: '',
  images: [],
};

const parseCoordinate = (value) => {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const isPhoneInvalid = (phone) => {
  const v = String(phone || '').trim();
  if (!v || v.includes('@')) return true;
  const digits = v.replace(/\D/g, '');
  return digits.length < 7 || digits.length > 15;
};

const normalizeSalon = (salon = {}) => ({
  ...salon,
  openTime: toTimeInputValue(salon.openTime, '09:00'),
  closeTime: toTimeInputValue(salon.closeTime, '18:00'),
});

const friendlyError = (t, err, fallback) => {
  if (err?.response?.status === 429) return t('common.rateLimited');
  if (err && !err.response && err.request) return t('common.network');
  const raw = String(err?.response?.data?.error || err?.message || fallback || t('common.error'));
  const n = raw.toLowerCase();
  const dup = /duplicate|already in use|unique|constraint/.test(n);
  if (n.includes('already has a salon profile') || n.includes('owner_id')) return t('owner.err.hasSalon');
  if (dup && n.includes('phone')) return t('owner.err.dupPhone');
  if (dup && n.includes('email')) return t('owner.err.dupEmail');
  return raw;
};

const detectLocation = (t) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error(t('salons.err.noGeo')));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => reject(new Error(t('owner.err.geoDenied'))),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
    return undefined;
  });

const when = (iso) => {
  const d = new Date(iso);
  return {
    day: formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' }),
    time: formatTime(d),
  };
};

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 12) return 'owner.morning';
  if (h < 17) return 'owner.afternoon';
  return 'owner.evening';
};

const NAV = [
  ['overview', 'nav.overview'],
  ['bookings', 'admin.bookings'],
  ['menu', 'salon.menu'],
  ['profile', 'owner.salonProfile'],
];

/* ------------------------------------------------------------- sub-views */

function Group({ label, hint, children }) {
  return (
    <div className="grid gap-5 border-b border-line py-8 last:border-0 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10">
      <div>
        <p className="text-[15px] font-semibold text-ink">{label}</p>
        {hint && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SalonForm({ value, onChange, onSubmit, submitLabel, busy, onUseLocation, locating, title, description }) {
  const t = useT();
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const coordsReady = parseCoordinate(value.latitude) != null && parseCoordinate(value.longitude) != null;

  return (
    <form onSubmit={onSubmit}>
      {title && (
        <div className="mb-2">
          <h2 className="display text-[36px] text-ink">{title}</h2>
          {description && <p className="mt-1 text-ink-2">{description}</p>}
        </div>
      )}

      <Group label={t('owner.form.basics')} hint={t('owner.form.basicsHint')}>
        <Field label={t('owner.form.name')} htmlFor="sf-name">
          <input id="sf-name" className="field" value={value.name || ''} onChange={set('name')} required />
        </Field>
        <Field label={t('owner.form.cover')} htmlFor="sf-image" hint={t('owner.form.coverHint')}>
          <input
            id="sf-image"
            className="field"
            placeholder="https://"
            value={(value.images || [])[0] || ''}
            onChange={(e) => onChange({ ...value, images: e.target.value ? [e.target.value.trim()] : [] })}
          />
        </Field>
      </Group>

      <Group label={t('footer.contact')} hint={t('owner.form.contactHint')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('profile.phone')} htmlFor="sf-phone">
            <input
              id="sf-phone"
              type="tel"
              inputMode="tel"
              placeholder="+91 98765 43210"
              className="field"
              value={value.phoneNumber || ''}
              onChange={set('phoneNumber')}
              required
            />
          </Field>
          <Field label={t('auth.email')} htmlFor="sf-email">
            <input id="sf-email" type="email" className="field" value={value.email || ''} onChange={set('email')} required />
          </Field>
        </div>
      </Group>

      <Group label={t('salon.hours')} hint={t('owner.form.hoursHint')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('owner.form.opens')} htmlFor="sf-open">
            <input
              id="sf-open"
              type="time"
              className="field"
              value={toTimeInputValue(value.openTime, '09:00')}
              onChange={set('openTime')}
              required
            />
          </Field>
          <Field label={t('owner.form.closes')} htmlFor="sf-close">
            <input
              id="sf-close"
              type="time"
              className="field"
              value={toTimeInputValue(value.closeTime, '18:00')}
              onChange={set('closeTime')}
              required
            />
          </Field>
        </div>
      </Group>

      <Group label={t('owner.form.location')} hint={t('owner.form.locationHint')}>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field label={t('owner.form.street')} htmlFor="sf-address">
            <input id="sf-address" className="field" value={value.address || ''} onChange={set('address')} />
          </Field>
          <Field label={t('salons.city')} htmlFor="sf-city">
            <input id="sf-city" className="field" value={value.city || ''} onChange={set('city')} required />
          </Field>
        </div>
        {MAPBOX_ACCESS_TOKEN && (
          <MapboxLocationPicker
            accessToken={MAPBOX_ACCESS_TOKEN}
            value={{ latitude: parseCoordinate(value.latitude), longitude: parseCoordinate(value.longitude) }}
            onChange={({ latitude, longitude }) =>
              onChange({ ...value, latitude: Number(latitude).toFixed(6), longitude: Number(longitude).toFixed(6) })
            }
          />
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label={t('owner.form.lat')} htmlFor="sf-lat">
            <input id="sf-lat" type="number" step="any" className="field" value={value.latitude ?? ''} onChange={set('latitude')} />
          </Field>
          <Field label={t('owner.form.lng')} htmlFor="sf-lng">
            <input id="sf-lng" type="number" step="any" className="field" value={value.longitude ?? ''} onChange={set('longitude')} />
          </Field>
          <button type="button" className="btn-secondary" onClick={onUseLocation} disabled={locating}>
            <LocateFixed size={15} /> {locating ? t('salons.locating') : t('owner.form.useLocation')}
          </button>
        </div>
        {!coordsReady && <p className="text-[13px] text-warning">{t('owner.form.needLocation')}</p>}
      </Group>

      <div className="flex justify-end border-t border-line pt-6">
        <button type="submit" className="btn-dark btn-lg" disabled={busy || !coordsReady}>
          {busy ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}

function BookingActions({ booking, onStatus, onCancel, userId, compact }) {
  const t = useT();
  const sm = compact ? 'btn-sm' : '';
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {booking.status === 'PENDING' && (
        <>
          <button type="button" className={`btn-dark ${sm}`} onClick={() => onStatus(booking, 'CONFIRMED')}>
            {t('owner.accept')}
          </button>
          <button type="button" className={`btn-secondary ${sm}`} onClick={() => onCancel(booking)}>
            {t('owner.decline')}
          </button>
        </>
      )}
      {booking.status === 'CONFIRMED' && (
        <>
          <button type="button" className={`btn-secondary ${sm}`} onClick={() => onStatus(booking, 'COMPLETED')}>
            {t('owner.markDone')}
          </button>
          <button
            type="button"
            className={`btn-ghost ${sm} text-danger hover:bg-danger-soft hover:text-danger`}
            onClick={() => onCancel(booking)}
          >
            {t('common.cancel')}
          </button>
        </>
      )}
      {Number(booking.customerId) !== Number(userId) && (
        <Link to={`/chat/${booking.customerId}`} className={`icon-btn`} aria-label={t('chat.placeholder', { name: booking.customerName || t('chat.client') })}>
          <MessageCircle size={16} />
        </Link>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- page */

export default function SalonOwnerDashboard() {
  const { user } = useAuth();
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState('');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [insights, setInsights] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const section = NAV.some(([key]) => key === searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const setSection = (key) =>
    setSearchParams(key === 'overview' ? {} : { tab: key }, { replace: true });
  const [bookingFilter, setBookingFilter] = useState('requests');

  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [pendingDeleteServiceId, setPendingDeleteServiceId] = useState(null);
  const [pendingCancelBooking, setPendingCancelBooking] = useState(null);
  const [busy, setBusy] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptySalonForm);
  const [profileDraft, setProfileDraft] = useState(null);
  const [locating, setLocating] = useState(false);

  const flashTimer = useRef(null);
  const flash = (message) => {
    setSuccess(message);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setSuccess(''), 3000);
  };

  const selectedSalon = useMemo(
    () => salons.find((s) => String(s.id) === String(selectedSalonId)) || null,
    [salons, selectedSalonId]
  );

  const loadSalonData = useCallback(async (salonId) => {
    if (!salonId) return;
    try {
      const [serviceData, bookingData, categoryData] = await Promise.all([
        api.get(`/api/service-offerings/salon/${salonId}`),
        api.get(`/api/bookings/salon/${salonId}`),
        api.get(`/api/categories/salon/${salonId}`),
      ]);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      const cats = Array.isArray(categoryData) ? categoryData : [];
      setCategories(cats);
      setServiceForm((prev) => ({
        ...prev,
        categoryId: cats.some((c) => String(c.id) === String(prev.categoryId)) ? prev.categoryId : String(cats[0]?.id || ''),
      }));
    } catch (err) {
      setError(friendlyError(t, err, t('owner.err.loadSalon')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInsights = useCallback((salonId) => {
    if (!salonId) return setInsights(null);
    api
      .get(`/api/analytics/salon/${salonId}/overview?days=30`)
      .then(setInsights)
      .catch(() => setInsights(null));
    return undefined;
  }, []);

  const loadOwner = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const owned = await api.get('/api/salons/me');
      const list = Array.isArray(owned) ? owned.map(normalizeSalon) : [];
      setSalons(list);
      setSelectedSalonId((prev) =>
        prev && list.some((s) => String(s.id) === String(prev)) ? prev : list[0] ? String(list[0].id) : ''
      );
      if (!list.length) setCreating(true);
    } catch (err) {
      setError(friendlyError(t, err, t('owner.err.load')));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOwner();
  }, [loadOwner]);

  useEffect(() => {
    if (!selectedSalonId) return;
    loadSalonData(selectedSalonId);
    loadInsights(selectedSalonId);
  }, [selectedSalonId, loadSalonData, loadInsights]);

  useEffect(() => {
    setProfileDraft(selectedSalon ? { ...selectedSalon } : null);
  }, [selectedSalon]);

  /* ---------------- booking groups */
  const now = Date.now();
  const groups = useMemo(() => {
    const requests = [];
    const upcoming = [];
    const past = [];
    const cancelled = [];
    bookings.forEach((b) => {
      const ended = new Date(b.endTime).getTime() < now;
      if (b.status === 'CANCELLED') cancelled.push(b);
      else if (b.status === 'PENDING' && !ended) requests.push(b);
      else if (b.status === 'CONFIRMED' && !ended) upcoming.push(b);
      else past.push(b);
    });
    const asc = (a, b) => new Date(a.startTime) - new Date(b.startTime);
    const desc = (a, b) => new Date(b.startTime) - new Date(a.startTime);
    return {
      requests: requests.sort(asc),
      upcoming: upcoming.sort(asc),
      past: past.sort(desc),
      cancelled: cancelled.sort(desc),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  /* ---------------- actions */
  const validateSalon = (form) => {
    const lat = parseCoordinate(form.latitude);
    const lng = parseCoordinate(form.longitude);
    const open = toMinuteOfDay(toTimeInputValue(form.openTime, '09:00'));
    const close = toMinuteOfDay(toTimeInputValue(form.closeTime, '18:00'));
    if (lat == null || lng == null) return t('owner.err.location');
    if (open == null || close == null || close <= open) return t('owner.err.hours');
    if (isPhoneInvalid(form.phoneNumber)) return t('owner.err.phone');
    return null;
  };

  const salonPayload = (form) => ({
    ...form,
    name: String(form.name || '').trim(),
    address: String(form.address || '').trim(),
    city: String(form.city || '').trim(),
    phoneNumber: String(form.phoneNumber || '').trim(),
    email: String(form.email || '').trim().toLowerCase(),
    openTime: toTimeInputValue(form.openTime, '09:00'),
    closeTime: toTimeInputValue(form.closeTime, '18:00'),
    latitude: parseCoordinate(form.latitude),
    longitude: parseCoordinate(form.longitude),
  });

  const createSalon = async (e) => {
    e.preventDefault();
    const problem = validateSalon(createForm);
    if (problem) return setError(problem);
    try {
      setBusy(true);
      setError('');
      const created = await api.post('/api/salons/me', salonPayload(createForm));
      setCreateForm(emptySalonForm);
      setCreating(false);
      flash(t('owner.flash.live'));
      await loadOwner();
      if (created?.id) setSelectedSalonId(String(created.id));
      setSection('menu');
    } catch (err) {
      setError(friendlyError(t, err, t('owner.err.create')));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const problem = validateSalon(profileDraft);
    if (problem) return setError(problem);
    try {
      setBusy(true);
      setError('');
      await api.put(`/api/salons/${profileDraft.id}`, salonPayload(profileDraft));
      flash(t('owner.flash.profileSaved'));
      await loadOwner();
    } catch (err) {
      setError(friendlyError(t, err, t('owner.err.saveProfile')));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const fillLocation = async (target) => {
    try {
      setLocating(true);
      const { latitude, longitude } = await detectLocation(t);
      const patch = { latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) };
      if (target === 'create') setCreateForm((f) => ({ ...f, ...patch }));
      else setProfileDraft((f) => ({ ...f, ...patch }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const saveService = async (e) => {
    e.preventDefault();
    const payload = {
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim(),
      price: Number(serviceForm.price),
      duration: Number(serviceForm.duration),
      categoryId: parseInt(String(serviceForm.categoryId), 10),
      salonId: Number(selectedSalonId),
    };
    if (!payload.name) return setError(t('owner.err.serviceName'));
    if (!(payload.price > 0)) return setError(t('owner.err.price'));
    if (!(payload.duration > 0) || payload.duration > 720) return setError(t('owner.err.duration'));
    if (!categories.some((c) => Number(c.id) === payload.categoryId)) return setError(t('owner.err.category'));
    try {
      setBusy(true);
      setError('');
      if (editingServiceId) {
        await api.put(`/api/service-offerings/${editingServiceId}`, payload);
        flash(t('owner.flash.serviceUpdated'));
      } else {
        await api.post('/api/service-offerings', payload);
        flash(t('owner.flash.serviceAdded'));
      }
      setServiceForm((f) => ({ ...emptyServiceForm, categoryId: f.categoryId }));
      setEditingServiceId(null);
      loadSalonData(selectedSalonId);
    } catch (err) {
      setError(friendlyError(t, err, t('owner.err.saveService')));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const created = await api.post('/api/categories', { name, salonId: Number(selectedSalonId) });
      setCategories((prev) => [...prev, created]);
      setNewCategoryName('');
      setServiceForm((f) => ({ ...f, categoryId: String(created.id) }));
      flash(t('owner.flash.categoryAdded', { name: created.name }));
    } catch (err) {
      setError(friendlyError(t, err, t('owner.err.addCategory')));
    }
  };

  const deleteService = async () => {
    try {
      setBusy(true);
      await api.delete(`/api/service-offerings/${pendingDeleteServiceId}`);
      flash(t('owner.flash.serviceRemoved'));
      if (editingServiceId === pendingDeleteServiceId) {
        setEditingServiceId(null);
        setServiceForm(emptyServiceForm);
      }
      loadSalonData(selectedSalonId);
    } catch (err) {
      setError(friendlyError(t, err, t('owner.err.removeService')));
    } finally {
      setBusy(false);
      setPendingDeleteServiceId(null);
    }
  };

  const setStatus = async (booking, status) => {
    try {
      await api.put(`/api/bookings/${booking.id}`, { status });
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status } : b)));
      flash(
        status === 'CONFIRMED'
          ? t('owner.flash.accepted', { name: booking.customerName || t('chat.client') })
          : status === 'COMPLETED'
            ? t('owner.flash.completed')
            : t('owner.flash.cancelled')
      );
      loadInsights(selectedSalonId);
    } catch (err) {
      setError(friendlyError(t, err, t('owner.err.updateBooking')));
    }
  };

  /* ---------------- render */
  if (loading) return <PageLoader label={t('owner.loading')} />;

  const messages = (
    <div className="space-y-3">
      {success && <Notice tone="success">{success}</Notice>}
      {error && (
        <Notice tone="error" onDismiss={() => setError('')}>
          {error}
        </Notice>
      )}
    </div>
  );

  if (creating || !salons.length) {
    return (
      <div className="page max-w-4xl">
        <p className="eyebrow">{salons.length ? t('owner.setup.newLocation') : t('owner.setup.welcome')}</p>
        <h1 className="display mt-3 text-[48px] text-ink sm:text-[60px]">
          {salons.length ? t('owner.addAnother') : t('owner.setup.title')}
        </h1>
        <p className="lede mt-3 max-w-xl">{t('owner.setup.body')}</p>
        <div className="mt-8">{messages}</div>
        <div className="mt-6">
          <SalonForm
            value={createForm}
            onChange={setCreateForm}
            onSubmit={createSalon}
            submitLabel={t('owner.setup.publish')}
            busy={busy}
            onUseLocation={() => fillLocation('create')}
            locating={locating}
          />
        </div>
        {salons.length > 0 && (
          <button type="button" className="btn-ghost mt-4" onClick={() => setCreating(false)}>
            {t('owner.setup.back')}
          </button>
        )}
      </div>
    );
  }

  const categoryName = Object.fromEntries(categories.map((c) => [String(c.id), c.name]));
  const menuGroups = categories.map((c) => ({
    ...c,
    items: services.filter((s) => String(s.categoryId) === String(c.id)),
  }));

  const bookingRows = groups[bookingFilter] || [];

  return (
    <div className="shell grid gap-10 pb-24 pt-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14 lg:pt-12">
      {/* Sidebar */}
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <label htmlFor="salon-switch" className="eyebrow">
          {t('chat.salon')}
        </label>
        {salons.length > 1 ? (
          <select
            id="salon-switch"
            className="field mt-2"
            value={selectedSalonId}
            onChange={(e) => setSelectedSalonId(e.target.value)}
          >
            {salons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-2 text-[17px] font-semibold text-ink">{selectedSalon?.name}</p>
        )}
        {selectedSalon && (
          <Link to={`/salon/${selectedSalon.id}`} className="mt-2 inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
            {t('owner.viewPublic')} <ArrowUpRight size={13} />
          </Link>
        )}

        <nav className="mt-8 flex gap-1 overflow-x-auto lg:flex-col" aria-label={t('nav.workspace')}>
          {NAV.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`flex shrink-0 items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                section === key ? 'bg-ink font-medium text-paper' : 'text-ink-2 hover:bg-sunken hover:text-ink'
              }`}
              aria-current={section === key ? 'page' : undefined}
            >
              {t(label)}
              {key === 'bookings' && groups.requests.length > 0 && (
                <span
                  className={`num ml-3 rounded-full px-1.5 text-[11px] font-semibold ${
                    section === key ? 'bg-paper/20 text-paper' : 'bg-accent text-accent-ink'
                  }`}
                >
                  {groups.requests.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button type="button" className="btn-ghost btn-sm mt-6 hidden lg:inline-flex" onClick={() => setCreating(true)}>
          <Plus size={14} /> {t('owner.addAnother')}
        </button>
      </aside>

      {/* Main */}
      <main className="min-w-0">
        {section === 'overview' && (
          <div className="animate-fade">
            <p className="eyebrow">{t('nav.overview')}</p>
            <h1 className="display mt-3 text-[44px] text-ink sm:text-[54px]">
              {t(greetingKey(), { name: (user?.fullName || user?.name || '').split(' ')[0] || t('owner.there') })}
            </h1>
            <p className="lede mt-2">
              {groups.requests.length
                ? t('owner.summaryRequests', { count: groups.requests.length })
                : groups.upcoming.length
                  ? t('owner.summaryUpcoming', { count: groups.upcoming.length })
                  : t('owner.summaryClear')}
            </p>

            <div className="mt-6">{messages}</div>

            <div className="mt-10 grid grid-cols-2 gap-y-8 border-y border-line py-8 lg:grid-cols-4 lg:divide-x lg:divide-line">
              <Stat
                label={t('owner.requests')}
                value={formatNumber(groups.requests.length)}
                note={t('owner.awaiting')}
                className="lg:pr-6"
              />
              <Stat
                label={t('bookings.tabUpcoming')}
                value={formatNumber(insights?.upcomingBookings ?? groups.upcoming.length)}
                note={t('owner.confirmedPending')}
                className="lg:px-6"
              />
              <Stat
                label={t('owner.earned')}
                value={statMoney(insights?.completedRevenue)}
                note={t('owner.bookedAhead', { amount: money(insights?.projectedRevenue) })}
                className="lg:px-6"
              />
              <Stat
                label={t('salon.review.rating')}
                value={insights?.reviewCount ? Number(insights.averageRating).toFixed(1) : '—'}
                note={t('salon.reviewCount', { count: insights?.reviewCount || 0 })}
                className="lg:pl-6"
              />
            </div>

            <div className="mt-12 grid gap-12 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <section>
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-[17px] font-semibold text-ink">{t('owner.needsReply')}</h2>
                  {groups.requests.length > 0 && (
                    <button
                      type="button"
                      className="text-sm text-ink-3 hover:text-ink"
                      onClick={() => {
                        setSection('bookings');
                        setBookingFilter('requests');
                      }}
                    >
                      {t('owner.seeAll')}
                    </button>
                  )}
                </div>
                {groups.requests.length === 0 ? (
                  <p className="rounded-md border border-dashed border-line-strong px-5 py-8 text-sm text-ink-3">
                    {t('owner.noRequests')}
                  </p>
                ) : (
                  <ul className="divide-y divide-line border-y border-line">
                    {groups.requests.slice(0, 5).map((b) => {
                      const w = when(b.startTime);
                      return (
                        <li key={b.id} className="flex flex-wrap items-center gap-4 py-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-ink">
                              {b.customerName || t('owner.clientFallback', { id: b.customerId })}
                            </p>
                            <p className="mt-0.5 truncate text-sm text-ink-3">
                              {w.day} · {w.time} · {(b.serviceNames || []).join(', ') || t('salon.servicesGroup')}
                            </p>
                          </div>
                          <span className="num text-sm font-medium">{money(b.totalPrice)}</span>
                          <BookingActions
                            booking={b}
                            onStatus={setStatus}
                            onCancel={setPendingCancelBooking}
                            userId={user?.id}
                            compact
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="mb-4 text-[17px] font-semibold text-ink">{t('owner.mostBooked')}</h2>
                {(insights?.popularServices || []).length === 0 ? (
                  <p className="text-sm text-ink-3">{t('owner.mostBookedEmpty')}</p>
                ) : (
                  <ol className="divide-y divide-line border-y border-line">
                    {insights.popularServices.slice(0, 5).map((s, i) => (
                      <li key={s.serviceId} className="flex items-baseline gap-3 py-3 text-sm">
                        <span className="num font-mono text-xs text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                        <span className="flex-1 text-ink">{s.serviceName}</span>
                        <span className="num text-ink-3">{s.count}×</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </div>
        )}

        {section === 'bookings' && (
          <div className="animate-fade">
            <p className="eyebrow">{t('admin.bookings')}</p>
            <h1 className="display mt-3 text-[44px] text-ink sm:text-[54px]">{t('owner.calendar')}</h1>
            <div className="mt-6">{messages}</div>

            <div className="tabs mt-6" role="tablist">
              {[
                ['requests', t('owner.requests')],
                ['upcoming', t('bookings.tabUpcoming')],
                ['past', t('owner.past')],
                ['cancelled', t('status.CANCELLED')],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={bookingFilter === key}
                  className="tab"
                  onClick={() => setBookingFilter(key)}
                >
                  {label} <span className="num ml-1 text-ink-3">{groups[key].length}</span>
                </button>
              ))}
            </div>

            {bookingRows.length === 0 ? (
              <EmptyState
                className="mt-8"
                title={t('owner.nothingHere')}
                description={bookingFilter === 'requests' ? t('owner.requestsEmpty') : t('owner.categoryEmpty')}
              />
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="data-table min-w-[720px]">
                  <thead>
                    <tr>
                      <th className="pt-4">{t('owner.col.when')}</th>
                      <th className="pt-4">{t('chat.client')}</th>
                      <th className="pt-4">{t('salon.servicesGroup')}</th>
                      <th className="pt-4 text-right">{t('salon.book.total')}</th>
                      <th className="pt-4">{t('owner.col.status')}</th>
                      <th className="pt-4">
                        <span className="sr-only">{t('owner.col.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingRows.map((b) => {
                      const w = when(b.startTime);
                      return (
                        <tr key={b.id}>
                          <td className="whitespace-nowrap">
                            <p className="font-medium text-ink">{w.day}</p>
                            <p className="text-[13px] text-ink-3">{w.time}</p>
                          </td>
                          <td className="text-ink">{b.customerName || t('owner.clientFallback', { id: b.customerId })}</td>
                          <td className="max-w-[220px] truncate text-ink-2">{(b.serviceNames || []).join(', ') || '—'}</td>
                          <td className="num text-right font-medium">{money(b.totalPrice)}</td>
                          <td>
                            <StatusTag status={b.status} />
                          </td>
                          <td>
                            <BookingActions
                              booking={b}
                              onStatus={setStatus}
                              onCancel={setPendingCancelBooking}
                              userId={user?.id}
                              compact
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {section === 'menu' && (
          <div className="animate-fade">
            <p className="eyebrow">{t('salon.menu')}</p>
            <h1 className="display mt-3 text-[44px] text-ink sm:text-[54px]">{t('owner.menuTitle')}</h1>
            <div className="mt-6">{messages}</div>

            <div className="mt-8 grid gap-12 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                {categories.length === 0 ? (
                  <EmptyState
                    title={t('owner.startCategory')}
                    description={t('owner.startCategoryBody')}
                  />
                ) : (
                  menuGroups.map((group) => (
                    <section key={group.id} className="mb-10">
                      <div className="flex items-baseline justify-between border-b border-line pb-2">
                        <p className="eyebrow">{group.name}</p>
                        <span className="text-[12px] text-ink-3">
                          {t('salons.serviceCount', { count: group.items.length })}
                        </span>
                      </div>
                      {group.items.length === 0 ? (
                        <p className="py-4 text-sm text-ink-3">{t('owner.categoryNoServices')}</p>
                      ) : (
                        <ul>
                          {group.items.map((s) => (
                            <li
                              key={s.id}
                              className={`flex items-start gap-4 border-b border-line py-4 ${
                                editingServiceId === s.id ? 'bg-accent-soft/40' : ''
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-ink">{s.name}</p>
                                {s.description && <p className="mt-0.5 text-sm text-ink-2">{s.description}</p>}
                                <p className="mt-1 text-[13px] text-ink-3">{formatDurationLabel(s.duration, t)}</p>
                              </div>
                              <span className="num pt-0.5 font-medium">{money(s.price)}</span>
                              <div className="flex">
                                <button
                                  type="button"
                                  className="icon-btn"
                                  aria-label={t('owner.editService', { name: s.name })}
                                  onClick={() => {
                                    setEditingServiceId(s.id);
                                    setServiceForm({
                                      name: s.name || '',
                                      description: s.description || '',
                                      price: String(s.price || ''),
                                      duration: String(s.duration || '30'),
                                      categoryId: String(s.categoryId || ''),
                                    });
                                  }}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn hover:!text-danger"
                                  aria-label={t('owner.deleteService', { name: s.name })}
                                  onClick={() => setPendingDeleteServiceId(s.id)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))
                )}
              </div>

              <aside className="xl:sticky xl:top-24 xl:self-start">
                <form onSubmit={saveService} className="rounded-lg border border-line bg-surface p-5">
                  <p className="font-semibold text-ink">{editingServiceId ? t('owner.svc.edit') : t('owner.svc.add')}</p>
                  <div className="mt-5 space-y-4">
                    <Field label={t('owner.svc.name')} htmlFor="svc-name">
                      <input
                        id="svc-name"
                        className="field"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </Field>
                    <Field label={t('owner.svc.description')} htmlFor="svc-desc" hint={t('owner.svc.descriptionHint')}>
                      <textarea
                        id="svc-desc"
                        rows={2}
                        maxLength={500}
                        className="field"
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('owner.svc.price')} htmlFor="svc-price">
                        <input
                          id="svc-price"
                          type="number"
                          inputMode="decimal"
                          min="1"
                          step="1"
                          placeholder="499"
                          className="field"
                          value={serviceForm.price}
                          onChange={(e) => setServiceForm((f) => ({ ...f, price: e.target.value }))}
                        />
                      </Field>
                      <Field label={t('owner.svc.minutes')} htmlFor="svc-dur">
                        <input
                          id="svc-dur"
                          type="number"
                          min="5"
                          max="720"
                          step="5"
                          className="field"
                          value={serviceForm.duration}
                          onChange={(e) => setServiceForm((f) => ({ ...f, duration: e.target.value }))}
                        />
                      </Field>
                    </div>
                    <Field label={t('owner.svc.category')} htmlFor="svc-cat">
                      <select
                        id="svc-cat"
                        className="field"
                        value={serviceForm.categoryId}
                        onChange={(e) => setServiceForm((f) => ({ ...f, categoryId: e.target.value }))}
                        disabled={!categories.length}
                      >
                        {!categories.length && <option value="">{t('owner.svc.addCategoryBelow')}</option>}
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {categoryName[String(c.id)]}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button type="submit" className="btn-dark flex-1" disabled={busy || !categories.length}>
                      {editingServiceId ? t('profile.saveChanges') : t('owner.svc.addToMenu')}
                    </button>
                    {editingServiceId && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          setEditingServiceId(null);
                          setServiceForm((f) => ({ ...emptyServiceForm, categoryId: f.categoryId }));
                        }}
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-4 rounded-lg border border-line p-5">
                  <p className="text-sm font-medium text-ink">{t('owner.newCategory')}</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="field h-10"
                      placeholder={t('owner.newCategoryPlaceholder')}
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                      aria-label={t('owner.newCategory')}
                    />
                    <button type="button" className="btn-secondary" onClick={addCategory} disabled={!newCategoryName.trim()}>
                      {t('salon.add')}
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {section === 'profile' && profileDraft && (
          <div className="animate-fade">
            <p className="eyebrow">{t('owner.salonProfile')}</p>
            <h1 className="display mt-3 text-[44px] text-ink sm:text-[54px]">{profileDraft.name || t('owner.yourSalon')}</h1>
            <div className="mt-6">{messages}</div>
            <div className="mt-4">
              <SalonForm
                value={profileDraft}
                onChange={setProfileDraft}
                onSubmit={saveProfile}
                submitLabel={t('owner.saveProfile')}
                busy={busy}
                onUseLocation={() => fillLocation('profile')}
                locating={locating}
              />
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={pendingDeleteServiceId != null}
        title={t('owner.removeTitle')}
        description={t('owner.removeBody')}
        confirmLabel={t('owner.removeConfirm')}
        cancelLabel={t('bookings.keep')}
        busy={busy}
        onConfirm={deleteService}
        onCancel={() => setPendingDeleteServiceId(null)}
      />
      <ConfirmDialog
        open={pendingCancelBooking != null}
        title={pendingCancelBooking?.status === 'PENDING' ? t('owner.declineTitle') : t('owner.cancelTitle')}
        description={t('owner.cancelBody', { name: pendingCancelBooking?.customerName || t('chat.client') })}
        confirmLabel={pendingCancelBooking?.status === 'PENDING' ? t('owner.decline') : t('owner.cancelConfirm')}
        cancelLabel={t('owner.goBack')}
        onConfirm={async () => {
          const b = pendingCancelBooking;
          setPendingCancelBooking(null);
          await setStatus(b, 'CANCELLED');
        }}
        onCancel={() => setPendingCancelBooking(null)}
      />
    </div>
  );
}
