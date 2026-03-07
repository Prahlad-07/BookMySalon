/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-14
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, Star } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { formatDurationLabel, formatTimeRange, toMinuteOfDay } from '../utils/time';

const toDateTimeInput = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  const roundedMinutes = date.getMinutes() - (date.getMinutes() % 15);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(roundedMinutes)}`;
};

const toBackendLocalDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
};

const buildEndTime = (startDate, totalMinutes) => new Date(startDate.getTime() + totalMinutes * 60 * 1000);

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

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.has(service.id)),
    [services, selectedServiceIds]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, service) => sum + (service.price || 0), 0),
    [selectedServices]
  );

  const totalMinutes = useMemo(
    () => selectedServices.reduce((sum, service) => sum + (service.duration || 0), 0),
    [selectedServices]
  );

  const effectiveDurationMinutes = selectedServices.length > 0 ? Math.max(totalMinutes, 30) : 0;

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const salonLocationLabel = useMemo(() => [salon?.address, salon?.city].filter(Boolean).join(', '), [salon?.address, salon?.city]);
  const salonHoursLabel = useMemo(() => formatTimeRange(salon?.openTime, salon?.closeTime), [salon?.openTime, salon?.closeTime]);

  const estimatedEndTimeLabel = useMemo(() => {
    if (selectedServices.length === 0) return 'Select services first';

    const start = new Date(startTimeInput);
    if (Number.isNaN(start.getTime())) return 'NA';

    const end = buildEndTime(start, effectiveDurationMinutes || 30);
    return end.toLocaleString();
  }, [effectiveDurationMinutes, selectedServices.length, startTimeInput]);

  const toggleService = (serviceId) => {
    setBookingError('');
    setBookingSuccess('');

    setSelectedServiceIds((previous) => {
      const next = new Set(previous);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (selectedServiceIds.size === 0) {
      setBookingError('Select at least one service before booking.');
      return;
    }

    if (!startTimeInput) {
      setBookingError('Please choose start date and time.');
      return;
    }

    const startDate = new Date(startTimeInput);
    if (Number.isNaN(startDate.getTime()) || startDate <= new Date()) {
      setBookingError('Start time must be in the future.');
      return;
    }

    const endDate = buildEndTime(startDate, effectiveDurationMinutes || 30);
    const openMinutes = toMinuteOfDay(salon?.openTime);
    const closeMinutes = toMinuteOfDay(salon?.closeTime);

    if (openMinutes != null && closeMinutes != null && closeMinutes > openMinutes) {
      const selectedStartMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const selectedEndMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      if (selectedStartMinutes < openMinutes || selectedEndMinutes > closeMinutes) {
        setBookingError(`Please select a slot between ${salonHoursLabel}.`);
        return;
      }
    }

    try {
      setIsBooking(true);
      setBookingError('');
      setBookingSuccess('');

      await api.post('/api/bookings/me', {
        salonId: Number(salonId),
        startTime: toBackendLocalDateTime(startDate),
        endTime: toBackendLocalDateTime(endDate),
        serviceOfferingIds: Array.from(selectedServiceIds),
      });

      setBookingSuccess('Booking confirmed. Track progress in My Bookings.');
      setSelectedServiceIds(new Set());
      setStartTimeInput(toDateTimeInput(new Date(Date.now() + 3600 * 1000)));
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 'Booking failed, please try again.';
      if (String(errorMessage).toLowerCase().includes('another user')) {
        setBookingError('Your session is out of sync. Please logout and login again, then retry booking.');
      } else {
        setBookingError(errorMessage);
      }
    } finally {
      setIsBooking(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (!reviewInput.text || reviewInput.text.trim().length < 10) {
      setReviewError('Review must be at least 10 characters.');
      return;
    }

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
        <button
          type="button"
          onClick={() => navigate('/salons')}
          className="text-blue-700 font-semibold hover:text-blue-800 inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back to salons
        </button>

        <div className="glass-effect rounded-3xl p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">{salon.name}</h1>
              <p className="text-slate-600 mt-2 inline-flex items-center gap-2">
                <MapPin size={16} /> {salonLocationLabel || 'Location not available'}
              </p>
              <p className="text-slate-600 mt-2 inline-flex items-center gap-2">
                <Clock size={16} /> {salonHoursLabel}
              </p>
            </div>

            <div className="text-right">
              <p className="text-slate-500 text-sm">Average rating</p>
              <p className="text-3xl font-bold text-slate-900">{averageRating.toFixed(1)}</p>
              <p className="text-slate-500 text-sm">{reviews.length} review(s)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-base rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Select Services</h2>

              {services.length === 0 ? (
                <p className="text-slate-600">No services available for this salon yet.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => {
                    const isSelected = selectedServiceIds.has(service.id);
                    return (
                      <label
                        key={service.id}
                        className={`block p-4 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleService(service.id)}
                              className="mt-1"
                            />
                            <div>
                              <p className="text-slate-900 font-semibold">{service.name}</p>
                              <p className="text-slate-600 text-sm">{service.description || 'No description available'}</p>
                            </div>
                          </div>

                          <div className="text-right text-slate-700">
                            <p className="font-semibold">${(service.price || 0).toFixed(2)}</p>
                            <p className="text-xs text-slate-500">{formatDurationLabel(service.duration)}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card-base rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-5">Customer Reviews</h2>

              <div className="space-y-4">
                {reviews.length === 0 && <p className="text-slate-600">No reviews yet.</p>}

                {reviews.map((review) => (
                  <div key={review.id} className="surface-muted rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-800 font-semibold">User #{review.userId}</p>
                      <div className="text-amber-500 inline-flex items-center gap-1">
                        <Star size={16} fill="currentColor" /> {review.rating}
                      </div>
                    </div>
                    <p className="text-slate-700">{review.text}</p>
                  </div>
                ))}
              </div>

              {user?.role === 'CUSTOMER' && (
                <form onSubmit={submitReview} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                  <h3 className="text-slate-900 font-semibold">Add your review</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <select
                      value={reviewInput.rating}
                      onChange={(event) =>
                        setReviewInput((previous) => ({
                          ...previous,
                          rating: event.target.value,
                        }))
                      }
                      className="input-field"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} Star
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={reviewInput.text}
                      onChange={(event) =>
                        setReviewInput((previous) => ({
                          ...previous,
                          text: event.target.value,
                        }))
                      }
                      className="input-field sm:col-span-3"
                      rows={3}
                      placeholder="Share your experience (minimum 10 characters)"
                    />
                  </div>

                  {reviewError && <p className="text-red-700 text-sm">{reviewError}</p>}
                  {reviewSuccess && <p className="text-emerald-700 text-sm">{reviewSuccess}</p>}

                  <button type="submit" disabled={isSubmittingReview} className="btn-secondary">
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div>
            <div className="card-base rounded-2xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-slate-900 inline-flex items-center gap-2 mb-5">
                <Calendar size={20} /> Book Appointment
              </h2>

              <div className="notice-box notice-info mb-4 text-sm">
                1. Select services. 2. Choose a start time in working hours. 3. Confirm and track in My Bookings.
              </div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date and Time</label>
              <input
                type="datetime-local"
                value={startTimeInput}
                onChange={(event) => setStartTimeInput(event.target.value)}
                min={toDateTimeInput(new Date(Date.now() + 15 * 60 * 1000))}
                className="input-field mb-2"
              />
              <p className="text-xs text-slate-500 mb-5">Salon hours: {salonHoursLabel}</p>

              <div className="surface-muted rounded-xl p-4 mb-5">
                <p className="text-slate-700 text-sm">Selected services: {selectedServices.length}</p>
                <p className="text-slate-700 text-sm mt-1">Estimated duration: {formatDurationLabel(effectiveDurationMinutes)}</p>
                <p className="text-slate-700 text-sm mt-1">Estimated end: {estimatedEndTimeLabel}</p>
                <p className="text-slate-900 text-2xl font-bold mt-2">${totalPrice.toFixed(2)}</p>
              </div>

              {bookingError && <div className="notice-box notice-error mb-3">{bookingError}</div>}
              {bookingSuccess && (
                <div className="notice-box notice-success mb-3">
                  <div className="inline-flex items-start gap-2">
                    <CheckCircle2 size={17} className="mt-0.5" />
                    <div>
                      <p>{bookingSuccess}</p>
                      <button type="button" onClick={() => navigate('/bookings')} className="text-sm font-semibold underline mt-1">
                        Open My Bookings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleBooking}
                disabled={isBooking || selectedServiceIds.size === 0}
                className="btn-primary w-full disabled:opacity-60"
              >
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
