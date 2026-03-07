/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Calendar, CheckCircle, Info, LocateFixed, MapPinned, Plus, Save, Scissors, Trash2 } from 'lucide-react';
import api from '../config/api';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import MapboxLocationPicker from '../components/maps/MapboxLocationPicker';
import { useAuth } from '../context/AuthContext';
import { formatDurationLabel, formatTimeRange, toMinuteOfDay, toTimeInputValue } from '../utils/time';

const emptyServiceForm = {
  name: '',
  description: '',
  price: '',
  duration: '30',
  categoryId: '',
};

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

const formatDateTime = (iso) => {
  if (!iso) return 'NA';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'NA';
  return dt.toLocaleString();
};

const parseCoordinate = (value) => {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeSalonRecord = (salon = {}) => ({
  ...salon,
  openTime: toTimeInputValue(salon.openTime, '09:00'),
  closeTime: toTimeInputValue(salon.closeTime, '18:00'),
});

const normalizeDashboardError = (err, fallbackMessage) => {
  const rawMessage = String(err?.response?.data?.error || err?.message || fallbackMessage || 'Request failed');
  const normalized = rawMessage.toLowerCase();

  if (
    (normalized.includes('duplicate entry') || normalized.includes('already in use')) &&
    normalized.includes('email')
  ) {
    return 'Salon email already exists. Use a different salon email or edit the existing salon.';
  }

  if (normalized.includes('already have a salon with this email')) {
    return 'You already created a salon with this email. Edit the existing salon profile instead.';
  }

  if (normalized.includes('could not execute statement') && normalized.includes('salons')) {
    return 'Unable to save salon right now. Check salon email/phone for duplicates and retry.';
  }

  return rawMessage;
};

export default function SalonOwnerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState('');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [showCreateSalonForm, setShowCreateSalonForm] = useState(false);
  const [createSalonForm, setCreateSalonForm] = useState(emptySalonForm);
  const [isDetectingCreateLocation, setIsDetectingCreateLocation] = useState(false);
  const [isDetectingProfileLocation, setIsDetectingProfileLocation] = useState(false);
  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [String(category.id), category.name])),
    [categories]
  );

  const selectedSalon = useMemo(
    () => salons.find((salon) => String(salon.id) === String(selectedSalonId)) || null,
    [salons, selectedSalonId]
  );

  const createSalonCoordinatesReady =
    parseCoordinate(createSalonForm.latitude) != null && parseCoordinate(createSalonForm.longitude) != null;
  const selectedSalonCoordinatesReady =
    selectedSalon && parseCoordinate(selectedSalon.latitude) != null && parseCoordinate(selectedSalon.longitude) != null;

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const confirmedCount = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
    const pendingCount = bookings.filter((booking) => booking.status === 'PENDING').length;

    return {
      totalRevenue,
      confirmedCount,
      pendingCount,
      serviceCount: services.length,
      bookingCount: bookings.length,
    };
  }, [bookings, services]);

  const setMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 2500);
  };

  const loadOwnerData = async () => {
    try {
      setLoading(true);
      setError('');
      const ownerSalons = await api.get('/api/salons/me');
      const normalizedSalons = Array.isArray(ownerSalons) ? ownerSalons.map(normalizeSalonRecord) : [];
      setSalons(normalizedSalons);

      const selected = normalizedSalons[0]?.id;
      setSelectedSalonId(selected ? String(selected) : '');

      if (selected) {
        await loadSalonData(selected);
      } else {
        setServices([]);
        setBookings([]);
      }
    } catch (err) {
      const errorMessage = normalizeDashboardError(err, 'Failed to load owner dashboard data');
      const normalizedMessage = String(errorMessage).toLowerCase();
      if (normalizedMessage.includes('only salon owners or admins') || normalizedMessage.includes('not marked as salon_owner')) {
        setSalons([]);
        setSelectedSalonId('');
        setServices([]);
        setCategories([]);
        setBookings([]);
        setError('');
        setMessage('Create your first salon to auto-enable owner access for this account.');
        return;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSalonData = async (salonId) => {
    if (!salonId) return;
    try {
      const [serviceData, bookingData, categoryData] = await Promise.all([
        api.get(`/api/service-offerings/salon/${salonId}`),
        api.get(`/api/bookings/salon/${salonId}`),
        api.get(`/api/categories/salon/${salonId}`),
      ]);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      const normalizedCategories = Array.isArray(categoryData) ? categoryData : [];
      setCategories(normalizedCategories);
      setServiceForm((prev) => ({
        ...prev,
        categoryId:
          prev.categoryId && normalizedCategories.some((c) => String(c.id) === String(prev.categoryId))
            ? String(prev.categoryId)
            : String(normalizedCategories[0]?.id || ''),
      }));
    } catch (err) {
      setError(normalizeDashboardError(err, 'Failed to load salon data'));
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  useEffect(() => {
    if (selectedSalonId) {
      loadSalonData(selectedSalonId);
    }
  }, [selectedSalonId]);

  const detectCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported in this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => reject(new Error('Location access denied or unavailable.')),
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });

  const updateCreateSalonCoordinates = ({ latitude, longitude }) => {
    setCreateSalonForm((previous) => ({
      ...previous,
      latitude: Number(latitude).toFixed(6),
      longitude: Number(longitude).toFixed(6),
    }));
  };

  const updateSelectedSalonCoordinates = ({ latitude, longitude }) => {
    if (!selectedSalon) return;
    setSalons((previous) =>
      previous.map((salon) =>
        salon.id === selectedSalon.id
          ? { ...salon, latitude: Number(latitude).toFixed(6), longitude: Number(longitude).toFixed(6) }
          : salon
      )
    );
  };

  const useCurrentLocationForCreateSalon = async () => {
    try {
      setError('');
      setIsDetectingCreateLocation(true);
      const coords = await detectCurrentLocation();
      updateCreateSalonCoordinates(coords);
      setMessage('Salon location captured from your current position');
    } catch (err) {
      setError(normalizeDashboardError(err, 'Unable to detect current location.'));
    } finally {
      setIsDetectingCreateLocation(false);
    }
  };

  const useCurrentLocationForProfile = async () => {
    if (!selectedSalon) return;
    try {
      setError('');
      setIsDetectingProfileLocation(true);
      const coords = await detectCurrentLocation();
      updateSelectedSalonCoordinates(coords);
      setMessage('Salon profile location updated from current position');
    } catch (err) {
      setError(normalizeDashboardError(err, 'Unable to detect current location.'));
    } finally {
      setIsDetectingProfileLocation(false);
    }
  };

  const createSalon = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const latitude = parseCoordinate(createSalonForm.latitude);
      const longitude = parseCoordinate(createSalonForm.longitude);
      const normalizedOpenTime = toTimeInputValue(createSalonForm.openTime, '09:00');
      const normalizedCloseTime = toTimeInputValue(createSalonForm.closeTime, '18:00');
      const openMinutes = toMinuteOfDay(normalizedOpenTime);
      const closeMinutes = toMinuteOfDay(normalizedCloseTime);

      if (latitude == null || longitude == null) {
        setError('Please select a location on the map before creating the salon.');
        return;
      }
      if (openMinutes == null || closeMinutes == null || closeMinutes <= openMinutes) {
        setError('Please provide valid opening and closing hours.');
        return;
      }

      const payload = {
        ...createSalonForm,
        name: createSalonForm.name.trim(),
        address: createSalonForm.address.trim(),
        city: createSalonForm.city.trim(),
        phoneNumber: createSalonForm.phoneNumber.trim(),
        email: createSalonForm.email.trim().toLowerCase(),
        openTime: normalizedOpenTime,
        closeTime: normalizedCloseTime,
        latitude,
        longitude,
      };

      await api.post('/api/salons/me', payload);
      setCreateSalonForm(emptySalonForm);
      setShowCreateSalonForm(false);
      setMessage('Salon created successfully');
      await loadOwnerData();
    } catch (err) {
      setError(normalizeDashboardError(err, 'Failed to create salon'));
    }
  };

  const createOrUpdateService = async (e) => {
    e.preventDefault();
    if (!selectedSalonId) return;

    const payload = {
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim(),
      price: Number(serviceForm.price),
      duration: Number(serviceForm.duration),
      categoryId: parseInt(String(serviceForm.categoryId), 10),
      salonId: Number(selectedSalonId),
    };

    if (!payload.name || payload.price <= 0 || payload.duration <= 0 || payload.categoryId <= 0) {
      setError('Please enter valid service name, price, duration and category.');
      return;
    }
    if (payload.duration > 720) {
      setError('Service duration should be 720 minutes (12 hours) or less.');
      return;
    }

    const hasCategory = categories.some((category) => Number(category.id) === payload.categoryId);
    if (!hasCategory) {
      setError('Selected category is invalid for this salon. Please create/select a valid category.');
      return;
    }

    try {
      setError('');
      if (editingServiceId) {
        await api.put(`/api/service-offerings/${editingServiceId}`, payload);
        setMessage('Service updated successfully');
      } else {
        await api.post('/api/service-offerings', payload);
        setMessage('Service created successfully');
      }
      setServiceForm(emptyServiceForm);
      setEditingServiceId(null);
      loadSalonData(selectedSalonId);
    } catch (err) {
      setError(normalizeDashboardError(err, 'Failed to save service'));
    }
  };

  const editService = (service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      price: String(service.price || ''),
      duration: String(service.duration || '30'),
      categoryId: String(service.categoryId || ''),
    });
  };

  const createCategory = async () => {
    if (!selectedSalonId) return;
    if (!newCategoryName.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setError('');
      const created = await api.post('/api/categories', {
        name: newCategoryName.trim(),
        salonId: Number(selectedSalonId),
      });
      const nextCategories = [...categories, created];
      setCategories(nextCategories);
      setNewCategoryName('');
      setServiceForm((prev) => ({ ...prev, categoryId: String(created.id) }));
      setMessage('Category created successfully');
    } catch (err) {
      setError(normalizeDashboardError(err, 'Failed to create category'));
    }
  };

  const deleteService = async (serviceId) => {
    try {
      await api.delete(`/api/service-offerings/${serviceId}`);
      setMessage('Service deleted successfully');
      loadSalonData(selectedSalonId);
    } catch (err) {
      setError(normalizeDashboardError(err, 'Failed to delete service'));
    }
  };

  const updateBookingStatus = async (booking, status) => {
    try {
      const payload = {
        startTime: booking.startTime,
        endTime: booking.endTime,
        status,
      };
      await api.put(`/api/bookings/${booking.id}`, payload);
      setMessage(`Booking #${booking.id} set to ${status}`);
      loadSalonData(selectedSalonId);
    } catch (err) {
      setError(normalizeDashboardError(err, 'Failed to update booking status'));
    }
  };

  const saveSalonProfile = async (e) => {
    e.preventDefault();
    if (!selectedSalon) return;

    try {
      setError('');
      const latitude = parseCoordinate(selectedSalon.latitude);
      const longitude = parseCoordinate(selectedSalon.longitude);
      const normalizedOpenTime = toTimeInputValue(selectedSalon.openTime, '09:00');
      const normalizedCloseTime = toTimeInputValue(selectedSalon.closeTime, '18:00');
      const openMinutes = toMinuteOfDay(normalizedOpenTime);
      const closeMinutes = toMinuteOfDay(normalizedCloseTime);

      if (latitude == null || longitude == null) {
        setError('Latitude and longitude are required. Use the map to set a valid location.');
        return;
      }
      if (openMinutes == null || closeMinutes == null || closeMinutes <= openMinutes) {
        setError('Opening time must be earlier than closing time.');
        return;
      }

      await api.put(`/api/salons/${selectedSalon.id}`, {
        ...selectedSalon,
        openTime: normalizedOpenTime,
        closeTime: normalizedCloseTime,
        latitude,
        longitude,
      });
      setMessage('Salon profile updated successfully');
      loadOwnerData();
    } catch (err) {
      setError(normalizeDashboardError(err, 'Failed to update salon profile'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-violet-200/30 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Salon Owner Console</h1>
            <p className="text-slate-600 mt-2">Create your salon, then manage profile, services and booking operations.</p>
          </div>

          <div className="flex gap-2">
            {salons.length > 0 && (
              <select
                value={selectedSalonId}
                onChange={(e) => setSelectedSalonId(e.target.value)}
                className="input-field max-w-xs"
              >
                {salons.map((salon) => (
                  <option key={salon.id} value={salon.id}>{salon.name}</option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowCreateSalonForm((prev) => !prev)}
              className="btn-primary"
            >
              {showCreateSalonForm ? 'Close Form' : 'Create New Salon'}
            </button>
          </div>
        </div>

        {error && <div className="border border-red-300 bg-red-50 text-red-700 rounded-xl p-4">{error}</div>}
        {success && <div className="border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-xl p-4">{success}</div>}

        {(showCreateSalonForm || salons.length === 0) && (
          <form onSubmit={createSalon} className="card-base rounded-2xl p-6 space-y-4">
            <h2 className="text-2xl text-slate-900 font-semibold">Create Salon</h2>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                <Info size={16} /> Recommended posting flow
              </p>
              <p>1. Fill salon basics: name, contact and city.</p>
              <p>2. Set exact map location using click/drag or current location.</p>
              <p>3. Create salon, then add categories and services immediately.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input-field" placeholder="Salon Name" value={createSalonForm.name} onChange={(e) => setCreateSalonForm((p) => ({ ...p, name: e.target.value }))} required />
              <input className="input-field" placeholder="Salon Email" type="email" value={createSalonForm.email} onChange={(e) => setCreateSalonForm((p) => ({ ...p, email: e.target.value }))} required />
              <p className="text-xs text-slate-500 md:col-span-2">Use a unique salon email. Reusing an existing salon email is not allowed.</p>
              <input className="input-field" placeholder="Phone Number (e.g. +91XXXXXXXXXX)" value={createSalonForm.phoneNumber} onChange={(e) => setCreateSalonForm((p) => ({ ...p, phoneNumber: e.target.value }))} required />
              <input className="input-field" placeholder="City" value={createSalonForm.city} onChange={(e) => setCreateSalonForm((p) => ({ ...p, city: e.target.value }))} required />
              <input className="input-field md:col-span-2" placeholder="Address (optional)" value={createSalonForm.address} onChange={(e) => setCreateSalonForm((p) => ({ ...p, address: e.target.value }))} />
              <input className="input-field" type="time" value={createSalonForm.openTime} onChange={(e) => setCreateSalonForm((p) => ({ ...p, openTime: e.target.value }))} required />
              <input className="input-field" type="time" value={createSalonForm.closeTime} onChange={(e) => setCreateSalonForm((p) => ({ ...p, closeTime: e.target.value }))} required />
              <p className="text-xs text-slate-500 md:col-span-2">Working hours: {formatTimeRange(createSalonForm.openTime, createSalonForm.closeTime)}</p>
              <input
                className="input-field"
                type="number"
                step="any"
                placeholder="Latitude"
                value={createSalonForm.latitude}
                onChange={(e) => setCreateSalonForm((p) => ({ ...p, latitude: e.target.value }))}
                required
              />
              <input
                className="input-field"
                type="number"
                step="any"
                placeholder="Longitude"
                value={createSalonForm.longitude}
                onChange={(e) => setCreateSalonForm((p) => ({ ...p, longitude: e.target.value }))}
                required
              />
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-sm text-slate-700 font-medium">Select salon location on map (click or drag marker).</p>
                <button
                  type="button"
                  onClick={useCurrentLocationForCreateSalon}
                  className="btn-outline px-4 py-2 text-sm inline-flex items-center gap-2"
                  disabled={isDetectingCreateLocation}
                >
                  <LocateFixed size={16} />
                  {isDetectingCreateLocation ? 'Detecting...' : 'Use Current Location'}
                </button>
              </div>
              <MapboxLocationPicker
                accessToken={MAPBOX_ACCESS_TOKEN}
                value={{
                  latitude: parseCoordinate(createSalonForm.latitude),
                  longitude: parseCoordinate(createSalonForm.longitude),
                }}
                onChange={updateCreateSalonCoordinates}
              />
              <p className={`mt-3 text-sm inline-flex items-center gap-2 ${createSalonCoordinatesReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                <MapPinned size={16} />
                {createSalonCoordinatesReady ? 'Location selected and ready for posting.' : 'Select salon location to enable Create Salon.'}
              </p>
            </div>
            <button type="submit" className="btn-secondary" disabled={!createSalonCoordinatesReady}>
              {createSalonCoordinatesReady ? 'Create Salon' : 'Set Location To Continue'}
            </button>
          </form>
        )}

        {salons.length === 0 ? (
          <div className="card-base rounded-2xl p-8 text-center text-slate-700">
            No salons yet. Use the form above to create your first salon.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="card-base rounded-2xl p-5">
                <p className="text-slate-600 flex items-center gap-2"><Calendar size={16} /> Total Bookings</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.bookingCount}</p>
              </div>
              <div className="card-base rounded-2xl p-5">
                <p className="text-slate-600">Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="card-base rounded-2xl p-5">
                <p className="text-slate-600 flex items-center gap-2"><Scissors size={16} /> Services</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.serviceCount}</p>
              </div>
              <div className="card-base rounded-2xl p-5">
                <p className="text-slate-600">Confirmed</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.confirmedCount}</p>
              </div>
              <div className="card-base rounded-2xl p-5">
                <p className="text-slate-600">Pending</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.pendingCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <motion.form onSubmit={saveSalonProfile} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-base rounded-2xl p-6 space-y-4">
                <h2 className="text-2xl text-slate-900 font-semibold flex items-center gap-2"><Building2 size={20} /> Salon Profile</h2>
                <input className="input-field" value={selectedSalon.name || ''} onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, name: e.target.value } : salon)))} placeholder="Salon name" />
                <input className="input-field" value={selectedSalon.address || ''} onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, address: e.target.value } : salon)))} placeholder="Address" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input-field" value={selectedSalon.city || ''} onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, city: e.target.value } : salon)))} placeholder="City" />
                  <input className="input-field" value={selectedSalon.phoneNumber || ''} onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, phoneNumber: e.target.value } : salon)))} placeholder="Phone" />
                </div>
                <input className="input-field" value={selectedSalon.email || ''} onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, email: e.target.value } : salon)))} placeholder="Email" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    type="time"
                    value={toTimeInputValue(selectedSalon.openTime, '09:00')}
                    onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, openTime: e.target.value } : salon)))}
                  />
                  <input
                    className="input-field"
                    type="time"
                    value={toTimeInputValue(selectedSalon.closeTime, '18:00')}
                    onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, closeTime: e.target.value } : salon)))}
                  />
                </div>
                <p className="text-xs text-slate-500">Current hours: {formatTimeRange(selectedSalon.openTime, selectedSalon.closeTime)}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    type="number"
                    step="any"
                    value={selectedSalon.latitude ?? ''}
                    onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, latitude: e.target.value } : salon)))}
                    placeholder="Latitude"
                  />
                  <input
                    className="input-field"
                    type="number"
                    step="any"
                    value={selectedSalon.longitude ?? ''}
                    onChange={(e) => setSalons((prev) => prev.map((salon) => (salon.id === selectedSalon.id ? { ...salon, longitude: e.target.value } : salon)))}
                    placeholder="Longitude"
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-sm text-slate-700 font-medium">Drag marker or click map to update profile location.</p>
                    <button
                      type="button"
                      onClick={useCurrentLocationForProfile}
                      className="btn-outline px-4 py-2 text-sm inline-flex items-center gap-2"
                      disabled={isDetectingProfileLocation}
                    >
                      <LocateFixed size={16} />
                      {isDetectingProfileLocation ? 'Detecting...' : 'Use Current Location'}
                    </button>
                  </div>
                  <MapboxLocationPicker
                    accessToken={MAPBOX_ACCESS_TOKEN}
                    value={{
                      latitude: parseCoordinate(selectedSalon.latitude),
                      longitude: parseCoordinate(selectedSalon.longitude),
                    }}
                    onChange={updateSelectedSalonCoordinates}
                  />
                  <p className={`mt-3 text-sm inline-flex items-center gap-2 ${selectedSalonCoordinatesReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                    <MapPinned size={16} />
                    {selectedSalonCoordinatesReady ? 'Profile location is valid.' : 'Please set a valid profile location.'}
                  </p>
                </div>
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={!selectedSalonCoordinatesReady}>
                  <Save size={16} /> Save Profile
                </button>
              </motion.form>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-base rounded-2xl p-6">
                <h2 className="text-2xl text-slate-900 font-semibold mb-4 flex items-center gap-2"><Plus size={20} /> Service Management</h2>
                <form onSubmit={createOrUpdateService} className="space-y-3 mb-5">
                  <input className="input-field" placeholder="Service name" value={serviceForm.name} onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))} required />
                  <textarea className="input-field" placeholder="Description" rows={2} value={serviceForm.description} onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input type="number" min="1" className="input-field" placeholder="Price" value={serviceForm.price} onChange={(e) => setServiceForm((prev) => ({ ...prev, price: e.target.value }))} required />
                    <input type="number" min="1" max="720" className="input-field" placeholder="Duration (minutes)" value={serviceForm.duration} onChange={(e) => setServiceForm((prev) => ({ ...prev, duration: e.target.value }))} required />
                  </div>
                  <div className="relative z-10">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Select Category</label>
                    <select
                      className="input-field w-full"
                      value={serviceForm.categoryId}
                      onChange={(e) => setServiceForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                      required
                    >
                      <option value="" disabled>
                        {categories.length === 0 ? 'No categories yet. Add one below.' : 'Choose a category'}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={String(category.id)}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categories.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">{categories.length} category option(s) available</p>
                    )}
                  </div>
                  {categories.length === 0 && (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Create at least one category before adding a service.
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      className="input-field md:col-span-2"
                      placeholder="Create new category (e.g., Hair, Facial, Spa)"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button type="button" className="btn-outline" onClick={createCategory}>Add Category</button>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-secondary" disabled={categories.length === 0}>{editingServiceId ? 'Update Service' : 'Add Service'}</button>
                    {editingServiceId && <button type="button" className="btn-outline" onClick={() => { setEditingServiceId(null); setServiceForm(emptyServiceForm); }}>Cancel Edit</button>}
                  </div>
                </form>

                <div className="space-y-3 max-h-80 overflow-auto pr-1">
                  {services.map((service) => (
                    <div key={service.id} className="card-base rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-slate-900 font-semibold">{service.name}</p>
                          <p className="text-slate-600 text-sm">{service.description || 'No description'}</p>
                          <p className="text-slate-500 text-sm mt-1">
                            ${service.price} • {formatDurationLabel(service.duration)} • Category {categoryNameById[String(service.categoryId)] || service.categoryId}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="btn-secondary" onClick={() => editService(service)}>Edit</button>
                          <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-3 py-2" onClick={() => deleteService(service.id)}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && <p className="text-slate-600">No services yet.</p>}
                </div>
              </motion.div>
            </div>

            <div className="card-base rounded-2xl p-6">
              <h2 className="text-2xl text-slate-900 font-semibold mb-4 flex items-center gap-2"><Calendar size={20} /> Booking Operations</h2>
              {bookings.length === 0 ? <p className="text-slate-600">No bookings for this salon yet.</p> : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="card-base rounded-xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-slate-900 font-semibold">Booking #{booking.id}</p>
                          <p className="text-slate-600 text-sm">Customer #{booking.customerId} • {formatDateTime(booking.startTime)}</p>
                          <p className="text-slate-500 text-sm">Amount: ${(booking.totalPrice || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm">{booking.status}</span>
                          {Number(booking.customerId) !== Number(user?.id) ? (
                            <Link to={`/chat/${booking.customerId}`} className="btn-secondary">
                              Chat
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500 px-2">Self booking</span>
                          )}
                          <button type="button" className="btn-secondary flex items-center gap-1" onClick={() => updateBookingStatus(booking, 'CONFIRMED')}><CheckCircle size={15} /> Confirm</button>
                          <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-2" onClick={() => updateBookingStatus(booking, 'COMPLETED')}>Complete</button>
                          <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-3 py-2" onClick={() => updateBookingStatus(booking, 'CANCELLED')}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
