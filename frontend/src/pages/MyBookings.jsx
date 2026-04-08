/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, RefreshCcw, XCircle } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

const formatDateTime = (iso) => {
  const dateTime = new Date(iso);
  return Number.isNaN(dateTime.getTime()) ? 'NA' : dateTime.toLocaleString();
};

const toLocalInput = (iso) => {
  const dateTime = new Date(iso);
  if (Number.isNaN(dateTime.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${dateTime.getFullYear()}-${pad(dateTime.getMonth() + 1)}-${pad(dateTime.getDate())}T${pad(
    dateTime.getHours()
  )}:${pad(dateTime.getMinutes())}`;
};

const toBackendLocalDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
};

const toStatusClass = (status) => {
  switch (String(status || '').toUpperCase()) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return 'status-pill status-success';
    case 'PENDING':
      return 'status-pill status-pending';
    case 'CANCELLED':
      return 'status-pill status-danger';
    default:
      return 'status-pill status-pending';
  }
};

export default function MyBookings() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [salons, setSalons] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleDraft, setRescheduleDraft] = useState({});

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');

      const [bookingData, salonData, serviceData] = await Promise.all([
        api.get(`/api/bookings/user/${user.id}`),
        api.get('/api/salons'),
        api.get('/api/service-offerings'),
      ]);

      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setSalons(Array.isArray(salonData) ? salonData : []);
      setServices(Array.isArray(serviceData) ? serviceData : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to load bookings right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const salonMap = useMemo(() => salons.reduce((acc, salon) => ({ ...acc, [salon.id]: salon }), {}), [salons]);
  const serviceMap = useMemo(
    () => services.reduce((acc, service) => ({ ...acc, [service.id]: service }), {}),
    [services]
  );

  const cancelBooking = async (bookingId) => {
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: 'CANCELLED',
              }
            : booking
        )
      );
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to cancel this booking right now.');
    }
  };

  const rescheduleBooking = async (booking) => {
    const draft = rescheduleDraft[booking.id];
    if (!draft) return;

    const newStart = new Date(draft);
    if (Number.isNaN(newStart.getTime())) return;
    if (newStart <= new Date()) {
      setError('Reschedule time must be in the future.');
      return;
    }

    const durationMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
    const nextEnd = new Date(newStart.getTime() + Math.max(durationMs, 30 * 60 * 1000));

    try {
      setError('');
      const updated = await api.put(`/api/bookings/${booking.id}`, {
        startTime: toBackendLocalDateTime(newStart),
        endTime: toBackendLocalDateTime(nextEnd),
      });
      setBookings((previous) => previous.map((item) => (item.id === booking.id ? { ...item, ...updated } : item)));
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to reschedule this booking right now.');
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-content page-stack">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Bookings</h1>
            <p className="page-subtitle">Track every appointment, reschedule when needed, or cancel in seconds.</p>
          </div>
          <button type="button" onClick={loadData} className="btn-secondary inline-flex items-center gap-2">
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        {error && <div className="notice-box notice-error">{error}</div>}

        {bookings.length === 0 ? (
          <div className="card-base rounded-2xl p-10 text-center text-slate-600">
            No bookings yet. Explore salons and schedule your first appointment.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const salon = salonMap[booking.salonId];
              const bookingServices = (booking.serviceOfferingIds || []).map((id) => serviceMap[id]).filter(Boolean);
              const isMutable = booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED';

              return (
                <div key={booking.id} className="card-base rounded-2xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{salon?.name || `Salon #${booking.salonId}`}</h2>
                      <p className="text-slate-600">Booking #{booking.id}</p>
                    </div>
                    <span className={toStatusClass(booking.status)}>{booking.status}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 mb-4">
                    <p className="inline-flex items-center gap-2">
                      <Calendar size={16} /> {formatDateTime(booking.startTime)}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Clock size={16} /> Ends {formatDateTime(booking.endTime)}
                    </p>
                    <p>City: {salon?.city || 'NA'}</p>
                    <p>Total: ${(booking.totalPrice || 0).toFixed(2)}</p>
                  </div>

                  <div className="mb-5">
                    <p className="text-slate-900 font-semibold mb-2">Booked Services</p>
                    {bookingServices.length === 0 ? (
                      <p className="text-slate-500">Service details are currently unavailable for this booking.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {bookingServices.map((service) => (
                          <span key={service.id} className="status-pill status-pending">
                            {service.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isMutable && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="datetime-local"
                        value={rescheduleDraft[booking.id] || toLocalInput(booking.startTime)}
                        onChange={(event) =>
                          setRescheduleDraft((previous) => ({
                            ...previous,
                            [booking.id]: event.target.value,
                          }))
                        }
                        min={toLocalInput(new Date(Date.now() + 15 * 60 * 1000))}
                        className="input-field md:col-span-2"
                      />
                      <button type="button" onClick={() => rescheduleBooking(booking)} className="btn-secondary">
                        Reschedule Slot
                      </button>

                      <button
                        type="button"
                        onClick={() => cancelBooking(booking.id)}
                        className="md:col-span-3 w-full btn-danger inline-flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} /> Cancel Booking
                      </button>
                    </div>
                  )}

                  {salon?.ownerId && Number(salon.ownerId) !== Number(user?.id) && (
                    <div className="mt-3">
                      <Link to={`/chat/${salon.ownerId}`} className="btn-secondary inline-block">
                        Message Salon Owner
                      </Link>
                    </div>
                  )}
                  {salon?.ownerId && Number(salon.ownerId) === Number(user?.id) && (
                    <p className="mt-3 text-sm text-slate-500">This booking belongs to your salon owner account.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
