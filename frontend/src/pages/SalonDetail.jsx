/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Star } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

const toDateTimeInput = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes() - (date.getMinutes() % 15))}`;
};

const buildEndTimeIso = (startDate, totalMinutes) => new Date(startDate.getTime() + totalMinutes * 60 * 1000).toISOString();

export default function SalonDetail() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
  const [startTimeInput, setStartTimeInput] = useState(toDateTimeInput(new Date(Date.now() + 3600 * 1000)));
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [reviewInput, setReviewInput] = useState({ rating: 5, text: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salonData, serviceData, reviewData] = await Promise.all([
        api.get(`/api/salons/${salonId}`),
        api.get(`/api/service-offerings/salon/${salonId}`),
        api.get(`/api/reviews/salon/${salonId}`),
      ]);
      setSalon(salonData);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
    } catch {
      setSalon(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salonId]);

  const selectedServices = useMemo(() => services.filter((service) => selectedServiceIds.has(service.id)), [services, selectedServiceIds]);
  const totalPrice = useMemo(() => selectedServices.reduce((sum, service) => sum + (service.price || 0), 0), [selectedServices]);
  const totalMinutes = useMemo(() => selectedServices.reduce((sum, service) => sum + (service.duration || 0), 0), [selectedServices]);
  const averageRating = useMemo(() => (reviews.length === 0 ? 0 : reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length), [reviews]);

  const toggleService = (serviceId) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const handleBooking = async () => {
    if (!user) return navigate('/login');
    if (selectedServiceIds.size === 0) return setBookingError('Select at least one service before booking.');
    if (!startTimeInput) return setBookingError('Please choose start date and time.');

    const startDate = new Date(startTimeInput);
    if (Number.isNaN(startDate.getTime()) || startDate <= new Date()) return setBookingError('Start time must be in the future.');

    try {
      setIsBooking(true);
      setBookingError('');
      setBookingSuccess('');
      await api.post(`/api/bookings/${user.id}`, {
        salonId: Number(salonId),
        startTime: startDate.toISOString(),
        endTime: buildEndTimeIso(startDate, Math.max(totalMinutes, 30)),
        serviceOfferingIds: Array.from(selectedServiceIds),
      });
      setBookingSuccess('Booking created successfully. You can track it in My Bookings.');
      setSelectedServiceIds(new Set());
    } catch (err) {
      setBookingError(err?.response?.data?.error || 'Booking failed, please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!reviewInput.text || reviewInput.text.trim().length < 10) return setReviewError('Review must be at least 10 characters.');

    try {
      setIsSubmittingReview(true);
      setReviewError('');
      setReviewSuccess('');
      await api.post(`/api/reviews/${user.id}`, {
        salonId: Number(salonId),
        rating: Number(reviewInput.rating),
        text: reviewInput.text.trim(),
      });
      setReviewInput({ rating: 5, text: '' });
      setReviewSuccess('Review submitted successfully.');
      loadData();
    } catch (err) {
      setReviewError(err?.response?.data?.error || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return <div className="min-h-screen flex items-center justify-center text-slate-700">Unable to load salon details.</div>;
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <button type="button" onClick={() => navigate('/salons')} className="text-blue-700 font-semibold hover:text-blue-800 flex items-center gap-2">
          <ArrowLeft size={18} /> Back to salons
        </button>

        <div className="glass-effect rounded-3xl p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900">{salon.name}</h1>
              <p className="text-slate-600 mt-2 flex items-center gap-2"><MapPin size={16} /> {salon.address}, {salon.city}</p>
              <p className="text-slate-600 mt-2 flex items-center gap-2"><Clock size={16} /> {salon.openTime || '09:00'} - {salon.closeTime || '18:00'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-sm">Average rating</p>
              <p className="text-3xl font-extrabold text-slate-900">{averageRating.toFixed(1)}</p>
              <p className="text-slate-500 text-sm">{reviews.length} review(s)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-base p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Services</h2>
              {services.length === 0 ? (
                <p className="text-slate-600">No services available for this salon yet.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <label key={service.id} className={`block p-4 rounded-xl border cursor-pointer ${selectedServiceIds.has(service.id) ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={selectedServiceIds.has(service.id)} onChange={() => toggleService(service.id)} className="mt-1" />
                          <div>
                            <p className="text-slate-900 font-semibold">{service.name}</p>
                            <p className="text-slate-600 text-sm">{service.description || 'No description'}</p>
                          </div>
                        </div>
                        <div className="text-right text-slate-700">
                          <p>${(service.price || 0).toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{service.duration || 0} min</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="card-base p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Reviews</h2>
              <div className="space-y-4">
                {reviews.length === 0 && <p className="text-slate-600">No reviews yet.</p>}
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl p-4 border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-800 font-semibold">User #{review.userId}</p>
                      <div className="text-amber-500 flex items-center gap-1"><Star size={16} fill="currentColor" /> {review.rating}</div>
                    </div>
                    <p className="text-slate-700">{review.text}</p>
                  </div>
                ))}
              </div>

              {user?.role === 'CUSTOMER' && (
                <form onSubmit={submitReview} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                  <h3 className="text-slate-900 font-semibold">Add your review</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <select value={reviewInput.rating} onChange={(e) => setReviewInput((prev) => ({ ...prev, rating: e.target.value }))} className="input-field">
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Star</option>)}
                    </select>
                    <textarea value={reviewInput.text} onChange={(e) => setReviewInput((prev) => ({ ...prev, text: e.target.value }))} className="input-field sm:col-span-3" rows={3} placeholder="Share your experience (min 10 characters)" />
                  </div>
                  {reviewError && <p className="text-red-600 text-sm">{reviewError}</p>}
                  {reviewSuccess && <p className="text-emerald-700 text-sm">{reviewSuccess}</p>}
                  <button type="submit" disabled={isSubmittingReview} className="btn-secondary">{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</button>
                </form>
              )}
            </div>
          </div>

          <div>
            <div className="card-base p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-5"><Calendar size={20} /> Book Appointment</h2>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date & Time</label>
              <input type="datetime-local" value={startTimeInput} onChange={(e) => setStartTimeInput(e.target.value)} className="input-field mb-5" />

              <div className="booking-summary-box rounded-xl p-4 mb-5 border border-blue-100 bg-blue-50">
                <p className="booking-summary-meta text-slate-700">Selected services: {selectedServices.length}</p>
                <p className="booking-summary-meta text-slate-700">Estimated duration: {Math.max(totalMinutes, 0)} min</p>
                <p className="booking-summary-price text-slate-900 text-2xl font-extrabold mt-2">${totalPrice.toFixed(2)}</p>
              </div>

              {bookingError && <p className="text-red-600 text-sm mb-3">{bookingError}</p>}
              {bookingSuccess && <p className="text-emerald-700 text-sm mb-3">{bookingSuccess}</p>}

              <button type="button" onClick={handleBooking} disabled={isBooking || selectedServiceIds.size === 0} className="btn-primary w-full disabled:opacity-60">
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
