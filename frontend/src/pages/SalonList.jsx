/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  Filter,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { buildDirectionsUrl, MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import NearbySalonsMap from '../components/maps/NearbySalonsMap';
import { formatTimeRange } from '../utils/time';

const getBrowserLocation = () =>
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

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const computeServiceCountBySalon = (allServices = []) => {
  return allServices.reduce((accumulator, service) => {
    const salonId = Number(service.salonId);
    if (!Number.isFinite(salonId)) return accumulator;
    accumulator[salonId] = (accumulator[salonId] || 0) + 1;
    return accumulator;
  }, {});
};

export default function SalonList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [salons, setSalons] = useState([]);
  const [serviceCountBySalon, setServiceCountBySalon] = useState({});

  const [nameQuery, setNameQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [sortBy, setSortBy] = useState('distance');

  const [userLocation, setUserLocation] = useState(null);
  const [activeSalonId, setActiveSalonId] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const deferredNameQuery = useDeferredValue(nameQuery);
  const deferredCityQuery = useDeferredValue(cityQuery);

  const isCustomerDashboard = location.pathname === '/customer/dashboard';

  const loadAllSalons = async () => {
    try {
      setLoading(true);
      setError('');
      setInfo('Showing all salons.');

      const [salonData, serviceData] = await Promise.all([api.get('/api/salons'), api.get('/api/service-offerings')]);
      const normalizedSalons = Array.isArray(salonData) ? salonData : [];
      const normalizedServices = Array.isArray(serviceData) ? serviceData : [];

      setSalons(normalizedSalons);
      setServiceCountBySalon(computeServiceCountBySalon(normalizedServices));
      setActiveSalonId(normalizedSalons[0]?.id || null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load salons');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbySalons = async (coords, radiusOverride) => {
    const radius = Number(radiusOverride ?? radiusKm);

    if (!coords) {
      setError('Please enable your location to search nearby salons.');
      return;
    }
    if (!Number.isFinite(radius) || radius <= 0 || radius > 200) {
      setError('Radius must be between 1 and 200 km.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [nearbyData, serviceData] = await Promise.all([
        api.get('/api/salons/nearby', {
          params: {
            lat: coords.latitude,
            lng: coords.longitude,
            radius,
          },
        }),
        api.get('/api/service-offerings'),
      ]);

      const normalizedSalons = Array.isArray(nearbyData) ? nearbyData : [];
      const normalizedServices = Array.isArray(serviceData) ? serviceData : [];

      setSalons(normalizedSalons);
      setServiceCountBySalon(computeServiceCountBySalon(normalizedServices));
      setActiveSalonId(normalizedSalons[0]?.id || null);
      setInfo(`Showing salons within ${radius} km of your location.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load nearby salons');
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = async () => {
    try {
      setError('');
      setIsLocating(true);
      const coords = await getBrowserLocation();
      setUserLocation(coords);
      await loadNearbySalons(coords, radiusKm);
    } catch (err) {
      setError(err?.message || 'Unable to detect current location.');
    } finally {
      setIsLocating(false);
    }
  };

  const searchNearby = async () => {
    if (!userLocation) {
      await useCurrentLocation();
      return;
    }
    await loadNearbySalons(userLocation, radiusKm);
  };

  useEffect(() => {
    loadAllSalons();
  }, []);

  const filteredSalons = useMemo(() => {
    const normalizedName = deferredNameQuery.trim().toLowerCase();
    const normalizedCity = deferredCityQuery.trim().toLowerCase();

    const base = salons.filter((salon) => {
      const salonName = String(salon.name || '').toLowerCase();
      const salonCity = String(salon.city || '').toLowerCase();
      return salonName.includes(normalizedName) && salonCity.includes(normalizedCity);
    });

    const sorted = [...base];
    if (sortBy === 'name') {
      sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (sortBy === 'distance') {
      sorted.sort((a, b) => {
        const left = toNumber(a.distanceKm);
        const right = toNumber(b.distanceKm);
        if (left == null && right == null) return 0;
        if (left == null) return 1;
        if (right == null) return -1;
        return left - right;
      });
    }

    return sorted;
  }, [deferredCityQuery, deferredNameQuery, salons, sortBy]);

  const cityOptions = useMemo(() => {
    const options = Array.from(new Set(salons.map((salon) => String(salon.city || '').trim()).filter(Boolean)));
    return options.sort((a, b) => a.localeCompare(b));
  }, [salons]);
  const isFiltering = nameQuery !== deferredNameQuery || cityQuery !== deferredCityQuery;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-7">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            {isCustomerDashboard ? 'Customer Dashboard' : 'Find Salons Near You'}
          </h1>
          <p className="text-slate-600 mt-2">
            Discover nearby salons, compare services, and move from search to booking in one smooth flow.
          </p>
        </div>

        <div className="card-base rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Filter size={17} /> Search and Filters
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="relative lg:col-span-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="input-field input-with-icon"
                placeholder="Search by salon name"
                value={nameQuery}
                onChange={(event) => setNameQuery(event.target.value)}
              />
            </div>

            <div className="relative lg:col-span-3">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                list="city-options"
                className="input-field input-with-icon"
                placeholder="Filter by city"
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
              />
              <datalist id="city-options">
                {cityOptions.map((cityName) => (
                  <option key={cityName} value={cityName} />
                ))}
              </datalist>
            </div>

            <input
              type="number"
              min="1"
              max="200"
              className="input-field lg:col-span-2"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value || 10))}
              placeholder="Radius (km)"
            />

            <div className="relative lg:col-span-3">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select className="input-field input-with-icon" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="distance">Sort by distance</option>
                <option value="name">Sort by name</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={useCurrentLocation}
              className="btn-outline inline-flex items-center gap-2"
              disabled={isLocating}
            >
              <LocateFixed size={16} />
              {isLocating ? 'Detecting location...' : 'Use My Location'}
            </button>

            <button
              type="button"
              onClick={searchNearby}
              className="btn-secondary inline-flex items-center gap-2"
              disabled={loading}
            >
              <MapPin size={16} /> Search Nearby
            </button>

            <button
              type="button"
              onClick={loadAllSalons}
              className="btn-secondary inline-flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCcw size={16} /> Show All Salons
            </button>
          </div>
        </div>

        {info && <div className="notice-box notice-info">{info}</div>}
        {error && <div className="notice-box notice-error">{error}</div>}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-900">Map View</h2>
            <p className="text-sm text-slate-600">Click marker to see salon details and quick navigation links.</p>
          </div>

          <NearbySalonsMap
            accessToken={MAPBOX_ACCESS_TOKEN}
            salons={filteredSalons}
            userLocation={userLocation}
            activeSalonId={activeSalonId}
            onSalonSelect={(salon) => setActiveSalonId(Number(salon.id))}
          />
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-slate-600 font-medium">{filteredSalons.length} salon(s) found</p>
              <div className="flex items-center gap-2">
                {isFiltering && <span className="status-pill status-pending">Filtering...</span>}
                {userLocation && <span className="status-pill status-success">Location enabled</span>}
              </div>
            </div>

            {filteredSalons.length === 0 ? (
              <div className="card-base rounded-2xl p-10 text-center text-slate-600">
                No salons match the current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSalons.map((salon) => {
                  const directionsUrl = buildDirectionsUrl(userLocation, {
                    latitude: Number(salon.latitude),
                    longitude: Number(salon.longitude),
                  });
                  const isActive = Number(salon.id) === Number(activeSalonId);
                  const locationLabel = [salon.address, salon.city].filter(Boolean).join(', ');

                  return (
                    <motion.div
                      key={salon.id}
                      whileHover={{ y: -4 }}
                      onMouseEnter={() => setActiveSalonId(Number(salon.id))}
                      className={`card-base rounded-2xl p-6 flex flex-col ${isActive ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-2xl font-bold text-slate-900">{salon.name}</h3>
                        {toNumber(salon.distanceKm) != null && (
                          <span className="status-pill status-success">{Number(salon.distanceKm).toFixed(2)} km</span>
                        )}
                      </div>

                      <p className="text-slate-600 mt-3 flex items-start gap-2">
                        <MapPin size={16} className="mt-0.5" />
                        <span>{locationLabel || 'Location not available'}</span>
                      </p>

                      <p className="text-slate-600 mt-2 flex items-center gap-2">
                        <Clock size={16} /> {formatTimeRange(salon.openTime, salon.closeTime)}
                      </p>

                      <p className="text-sm text-slate-600 mt-2">
                        Services available: {serviceCountBySalon[Number(salon.id)] || 0}
                      </p>

                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/salon/${salon.id}`)}
                          className="btn-primary w-full inline-flex items-center justify-center gap-2"
                        >
                          View Details <ChevronRight size={16} />
                        </button>

                        {directionsUrl ? (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary w-full inline-flex items-center justify-center"
                          >
                            Directions
                          </a>
                        ) : (
                          <button type="button" className="btn-secondary w-full" disabled>
                            Directions N/A
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
