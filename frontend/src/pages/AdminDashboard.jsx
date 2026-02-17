/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Building2, Calendar, DollarSign, Scissors, Star } from 'lucide-react';
import api from '../config/api';

const statCardClass = 'card-base p-6';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [salons, setSalons] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [salonData, bookingData, serviceData] = await Promise.all([
          api.get('/api/salons'),
          api.get('/api/bookings'),
          api.get('/api/service-offerings'),
        ]);

        setSalons(Array.isArray(salonData) ? salonData : []);
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setServices(Array.isArray(serviceData) ? serviceData : []);
        setError('');
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const pending = bookings.filter((booking) => booking.status === 'PENDING').length;
    const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
    const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length;

    const bookingsBySalon = bookings.reduce((acc, booking) => {
      acc[booking.salonId] = (acc[booking.salonId] || 0) + 1;
      return acc;
    }, {});

    const topSalons = Object.entries(bookingsBySalon)
      .map(([salonId, count]) => {
        const salon = salons.find((item) => String(item.id) === String(salonId));
        return {
          salonId,
          count,
          name: salon?.name || `Salon #${salonId}`,
          city: salon?.city || 'NA',
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalRevenue, pending, confirmed, completed, topSalons };
  }, [bookings, salons]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Platform-level overview of growth and operational metrics.</p>
        </div>

        {error && <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 p-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={statCardClass}>
            <div className="flex items-center justify-between text-slate-600 mb-3"><span>Total Salons</span><Building2 size={18} /></div>
            <p className="text-3xl font-extrabold text-slate-900">{salons.length}</p>
          </div>
          <div className={statCardClass}>
            <div className="flex items-center justify-between text-slate-600 mb-3"><span>Total Bookings</span><Calendar size={18} /></div>
            <p className="text-3xl font-extrabold text-slate-900">{bookings.length}</p>
          </div>
          <div className={statCardClass}>
            <div className="flex items-center justify-between text-slate-600 mb-3"><span>Total Services</span><Scissors size={18} /></div>
            <p className="text-3xl font-extrabold text-slate-900">{services.length}</p>
          </div>
          <div className={statCardClass}>
            <div className="flex items-center justify-between text-slate-600 mb-3"><span>Revenue</span><DollarSign size={18} /></div>
            <p className="text-3xl font-extrabold text-slate-900">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-base p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2"><BarChart3 size={20} /> Booking Status</h2>
            <div className="space-y-3 text-slate-700">
              <div className="flex justify-between bg-slate-50 rounded-lg p-3"><span>Pending</span><span className="font-semibold">{stats.pending}</span></div>
              <div className="flex justify-between bg-slate-50 rounded-lg p-3"><span>Confirmed</span><span className="font-semibold">{stats.confirmed}</span></div>
              <div className="flex justify-between bg-slate-50 rounded-lg p-3"><span>Completed</span><span className="font-semibold">{stats.completed}</span></div>
            </div>
          </div>

          <div className="card-base p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2"><Star size={20} /> Top Salons</h2>
            {stats.topSalons.length === 0 ? (
              <p className="text-slate-600">No booking data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.topSalons.map((item) => (
                  <div key={item.salonId} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-900 font-semibold">{item.name}</p>
                    <p className="text-sm text-slate-600">{item.city} • {item.count} bookings</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
