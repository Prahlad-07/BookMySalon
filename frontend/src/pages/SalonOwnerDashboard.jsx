import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Calendar, CheckCircle, Plus, Save, Scissors, Trash2 } from 'lucide-react';
import api from '../config/api';

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
  images: [],
};

const formatDateTime = (iso) => {
  if (!iso) return 'NA';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'NA';
  return dt.toLocaleString();
};

export default function SalonOwnerDashboard() {
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
  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((category) => [String(category.id), category.name])),
    [categories]
  );

  const selectedSalon = useMemo(
    () => salons.find((salon) => String(salon.id) === String(selectedSalonId)) || null,
    [salons, selectedSalonId]
  );

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
      const normalizedSalons = Array.isArray(ownerSalons) ? ownerSalons : [];
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
      setError(err?.response?.data?.error || 'Failed to load owner dashboard data');
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
      setError(err?.response?.data?.error || 'Failed to load salon data');
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

  const createSalon = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        ...createSalonForm,
        name: createSalonForm.name.trim(),
        address: createSalonForm.address.trim(),
        city: createSalonForm.city.trim(),
        phoneNumber: createSalonForm.phoneNumber.trim(),
        email: createSalonForm.email.trim().toLowerCase(),
      };

      await api.post('/api/salons/me', payload);
      setCreateSalonForm(emptySalonForm);
      setShowCreateSalonForm(false);
      setMessage('Salon created successfully');
      await loadOwnerData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create salon');
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
      setError(err?.response?.data?.error || 'Failed to save service');
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
      setError(err?.response?.data?.error || 'Failed to create category');
    }
  };

  const deleteService = async (serviceId) => {
    try {
      await api.delete(`/api/service-offerings/${serviceId}`);
      setMessage('Service deleted successfully');
      loadSalonData(selectedSalonId);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete service');
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
      setError(err?.response?.data?.error || 'Failed to update booking status');
    }
  };

  const saveSalonProfile = async (e) => {
    e.preventDefault();
    if (!selectedSalon) return;

    try {
      await api.put(`/api/salons/${selectedSalon.id}`, selectedSalon);
      setMessage('Salon profile updated successfully');
      loadOwnerData();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update salon profile');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input-field" placeholder="Salon Name" value={createSalonForm.name} onChange={(e) => setCreateSalonForm((p) => ({ ...p, name: e.target.value }))} required />
              <input className="input-field" placeholder="Salon Email" type="email" value={createSalonForm.email} onChange={(e) => setCreateSalonForm((p) => ({ ...p, email: e.target.value }))} required />
              <input className="input-field" placeholder="Phone Number" value={createSalonForm.phoneNumber} onChange={(e) => setCreateSalonForm((p) => ({ ...p, phoneNumber: e.target.value }))} required />
              <input className="input-field" placeholder="City" value={createSalonForm.city} onChange={(e) => setCreateSalonForm((p) => ({ ...p, city: e.target.value }))} required />
              <input className="input-field md:col-span-2" placeholder="Address" value={createSalonForm.address} onChange={(e) => setCreateSalonForm((p) => ({ ...p, address: e.target.value }))} required />
              <input className="input-field" type="time" value={createSalonForm.openTime} onChange={(e) => setCreateSalonForm((p) => ({ ...p, openTime: e.target.value }))} required />
              <input className="input-field" type="time" value={createSalonForm.closeTime} onChange={(e) => setCreateSalonForm((p) => ({ ...p, closeTime: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-secondary">Create Salon</button>
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
                <button type="submit" className="btn-primary flex items-center gap-2"><Save size={16} /> Save Profile</button>
              </motion.form>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-base rounded-2xl p-6">
                <h2 className="text-2xl text-slate-900 font-semibold mb-4 flex items-center gap-2"><Plus size={20} /> Service Management</h2>
                <form onSubmit={createOrUpdateService} className="space-y-3 mb-5">
                  <input className="input-field" placeholder="Service name" value={serviceForm.name} onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))} required />
                  <textarea className="input-field" placeholder="Description" rows={2} value={serviceForm.description} onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))} />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" min="1" className="input-field" placeholder="Price" value={serviceForm.price} onChange={(e) => setServiceForm((prev) => ({ ...prev, price: e.target.value }))} required />
                    <input type="number" min="1" className="input-field" placeholder="Duration" value={serviceForm.duration} onChange={(e) => setServiceForm((prev) => ({ ...prev, duration: e.target.value }))} required />
                    <select className="input-field" value={serviceForm.categoryId} onChange={(e) => setServiceForm((prev) => ({ ...prev, categoryId: e.target.value }))} required>
                      <option value="" disabled>Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={String(category.id)}>
                          {category.name}
                        </option>
                      ))}
                    </select>
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
                            ${service.price} • {service.duration} min • Category {categoryNameById[String(service.categoryId)] || service.categoryId}
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
                          <Link to={`/chat/${booking.customerId}`} className="btn-secondary">
                            Chat
                          </Link>
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
