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
  const dt = new Date(iso);
  return Number.isNaN(dt.getTime()) ? 'NA' : dt.toLocaleString();
};

const toLocalInput = (iso) => {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
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
      setError(err?.response?.data?.error || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const salonMap = useMemo(() => salons.reduce((acc, salon) => ({ ...acc, [salon.id]: salon }), {}), [salons]);
  const serviceMap = useMemo(() => services.reduce((acc, service) => ({ ...acc, [service.id]: service }), {}), [services]);

  const cancelBooking = async (bookingId) => {
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, status: 'CANCELLED' } : booking)));
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const rescheduleBooking = async (booking) => {
    const draft = rescheduleDraft[booking.id];
    if (!draft) return;

    const newStart = new Date(draft);
    if (Number.isNaN(newStart.getTime())) return;

    const durationMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
    const nextEnd = new Date(newStart.getTime() + Math.max(durationMs, 30 * 60 * 1000));

    try {
      const updated = await api.put(`/api/bookings/${booking.id}`, {
        startTime: newStart.toISOString(),
        endTime: nextEnd.toISOString(),
      });
      setBookings((prev) => prev.map((item) => (item.id === booking.id ? { ...item, ...updated } : item)));
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reschedule booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900">My Bookings</h1>
            <p className="text-slate-600 mt-2">Reschedule or cancel upcoming appointments.</p>
          </div>
          <button type="button" onClick={loadData} className="btn-secondary flex items-center gap-2"><RefreshCcw size={16} /> Refresh</button>
        </div>

        {error && <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 p-4">{error}</div>}

        {bookings.length === 0 ? (
          <div className="card-base p-10 text-center text-slate-600">No bookings yet. Start by booking a salon service.</div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const salon = salonMap[booking.salonId];
              const bookingServices = (booking.serviceOfferingIds || []).map((id) => serviceMap[id]).filter(Boolean);

              return (
                <div key={booking.id} className="card-base p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{salon?.name || `Salon #${booking.salonId}`}</h2>
                      <p className="text-slate-600">Booking #{booking.id}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm">{booking.status}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 mb-4">
                    <p className="flex items-center gap-2"><Calendar size={16} /> {formatDateTime(booking.startTime)}</p>
                    <p className="flex items-center gap-2"><Clock size={16} /> Ends {formatDateTime(booking.endTime)}</p>
                    <p>City: {salon?.city || 'NA'}</p>
                    <p>Total: ${(booking.totalPrice || 0).toFixed(2)}</p>
                  </div>

                  <div className="mb-5">
                    <p className="text-slate-900 font-semibold mb-2">Services</p>
                    {bookingServices.length === 0 ? (
                      <p className="text-slate-500">No service names available.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {bookingServices.map((service) => (
                          <span key={service.id} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-700">{service.name}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="datetime-local"
                        value={rescheduleDraft[booking.id] || toLocalInput(booking.startTime)}
                        onChange={(e) => setRescheduleDraft((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                        className="input-field md:col-span-2"
                      />
                      <button type="button" onClick={() => rescheduleBooking(booking)} className="btn-secondary">Reschedule</button>

                      <button type="button" onClick={() => cancelBooking(booking.id)} className="md:col-span-3 w-full bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2">
                        <XCircle size={18} /> Cancel Booking
                      </button>
                    </div>
                  )}

                  {salon?.ownerId && (
                    <div className="mt-3">
                      <Link to={`/chat/${salon.ownerId}`} className="btn-secondary inline-block">
                        Chat with Salon Owner
                      </Link>
                    </div>
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
