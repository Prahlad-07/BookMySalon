import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Calendar,
  ChevronRight,
  Heart,
  ArrowLeft,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function SalonDetail() {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchSalonDetails();
    fetchServices();
    fetchReviews();
  }, [salonId]);

  const fetchSalonDetails = async () => {
    try {
      const response = await api.get(`/api/salons/${salonId}`);
      setSalon(response.data);
    } catch (err) {
      console.error('Failed to fetch salon details:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get(`/api/service-offering/salon/${salonId}`);
      setServices(response.data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/api/reviews/salon/${salonId}`);
      setReviews(response.data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleServiceToggle = (serviceId) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (selectedServices.size === 0 || !bookingDate || !bookingTime) {
      alert('Please select services and date/time');
      return;
    }

    setIsBooking(true);

    try {
      const response = await api.post('/api/bookings', {
        salonId,
        serviceOfferingIds: Array.from(selectedServices),
        bookingDate,
        startTime: bookingTime,
      }, {
        params: { paymentMethod: 'STRIPE' },
      });

      navigate('/bookings', { state: { bookingSuccess: true } });
    } catch (err) {
      alert('Booking failed. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setIsBooking(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-violet-200/30 border-t-violet-600 rounded-full"
        />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <p className="text-slate-300 text-xl">Salon not found</p>
      </div>
    );
  }

  const totalPrice = services
    .filter((s) => selectedServices.has(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Animations */}
      <motion.div
        animate={{ y: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="fixed top-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{ y: [0, -40, 0] }}
        transition={{ duration: 25, repeat: Infinity }}
        className="fixed bottom-20 right-10 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl -z-10"
      />

      <div className="py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/salons')}
            className="mb-8 flex items-center gap-2 text-violet-400 hover:text-violet-300 transition text-lg font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Salons
          </motion.button>

          {/* Hero Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="glass-effect rounded-3xl overflow-hidden mb-12 border border-white/10 backdrop-blur-xl"
          >
            {/* Header Image */}
            <div className="h-80 bg-gradient-to-br from-violet-600/30 via-purple-600/30 to-pink-600/30 flex items-center justify-center relative overflow-hidden">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-9xl"
              >
                💇‍♀️
              </motion.div>

              {/* Floating elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute top-8 right-8 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-2xl shadow-lg"
              >
                ⭐
              </motion.div>

              {/* Favorite Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 transition text-red-400 hover:text-red-300"
              >
                <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
              </motion.button>
            </div>

            {/* Info */}
            <div className="p-10">
              <div className="flex items-start justify-between mb-8">
                <div className="flex-grow">
                  <motion.h1 
                    variants={itemVariants}
                    className="text-5xl font-bold text-white mb-6 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                  >
                    {salon.name}
                  </motion.h1>

                  {/* Meta Info */}
                  <motion.div variants={itemVariants} className="space-y-4 text-slate-300">
                    <div className="flex items-center gap-3">
                      <MapPin size={22} className="text-violet-400 flex-shrink-0" />
                      <span className="text-lg">{salon.address}, {salon.city}, {salon.state}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock size={22} className="text-violet-400 flex-shrink-0" />
                      <span className="text-lg">{salon.openingTime} - {salon.closingTime}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={22} className="text-violet-400 flex-shrink-0" />
                      <span className="text-lg">{salon.phone || '+1 (555) 000-0000'}</span>
                    </div>
                  </motion.div>
                </div>

                {/* Rating */}
                <motion.div variants={itemVariants} className="text-right min-w-fit ml-8">
                  <div className="flex gap-1 justify-end mb-3">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Star size={28} className="fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-slate-300 font-semibold text-lg">{reviews.length} reviews</p>
                </motion.div>
              </div>

              {/* Description */}
              <motion.p variants={itemVariants} className="text-slate-300 text-lg leading-relaxed">
                {salon.description || 'Premium salon offering a wide range of beauty services including haircuts, styling, coloring, and treatments.'}
              </motion.p>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Services */}
            <div className="lg:col-span-2 space-y-8">
              {/* Services Section */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="glass-effect rounded-3xl p-10 border border-white/10 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles className="text-violet-400" size={28} />
                  <h2 className="text-3xl font-bold text-white">
                    Our Services
                  </h2>
                </div>

                {services.length > 0 ? (
                  <div className="space-y-4">
                    {services.map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleServiceToggle(service.id)}
                        className={`p-6 rounded-2xl cursor-pointer transition-all border-2 group ${
                          selectedServices.has(service.id)
                            ? 'bg-gradient-to-r from-violet-600/30 to-pink-600/30 border-violet-500'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <motion.input
                            type="checkbox"
                            checked={selectedServices.has(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="w-6 h-6 accent-violet-500 mt-1 cursor-pointer flex-shrink-0"
                          />
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">
                              {service.name}
                            </h3>
                            <p className="text-slate-300">
                              {service.description}
                            </p>
                          </div>
                          <div className="text-right min-w-fit">
                            <p className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                              ${service.price}
                            </p>
                            <p className="text-slate-400 text-sm">
                              {service.duration || '30'} mins
                            </p>
                          </div>
                        </div>

                        {selectedServices.has(service.id) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 flex items-center gap-2 text-emerald-400"
                          >
                            <CheckCircle size={18} />
                            <span className="text-sm font-semibold">Selected</span>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-300 text-center py-8">No services available</p>
                )}
              </motion.div>

              {/* Reviews Section */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="glass-effect rounded-3xl p-10 border border-white/10 backdrop-blur-xl"
              >
                <h2 className="text-3xl font-bold text-white mb-8">
                  Customer Reviews
                </h2>

                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="pb-6 border-b border-white/10 last:border-0"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <span className="text-4xl">👤</span>
                          <div className="flex-1">
                            <h3 className="font-bold text-white text-lg">
                              {review.userName || 'Anonymous'}
                            </h3>
                            <div className="flex gap-1 mt-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={18}
                                  className="fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-300 text-lg leading-relaxed">{review.comment}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-300 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </motion.div>
            </div>

            {/* Right Column - Booking Panel */}
            <div>
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="glass-effect rounded-3xl p-8 border border-white/10 backdrop-blur-xl sticky top-24 h-fit"
              >
                <div className="flex items-center gap-3 mb-8">
                  <Calendar className="text-violet-400" size={24} />
                  <h2 className="text-2xl font-bold text-white">
                    Book Now
                  </h2>
                </div>

                {/* Date Selection */}
                <motion.div whileHover={{ scale: 1.02 }} className="mb-6">
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                  />
                </motion.div>

                {/* Time Selection */}
                <motion.div whileHover={{ scale: 1.02 }} className="mb-6">
                  <label className="block text-sm font-semibold text-slate-200 mb-3">
                    Select Time
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                  >
                    <option value="" className="bg-slate-900">Choose a time</option>
                    {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(
                      (time) => (
                        <option key={time} value={time} className="bg-slate-900">
                          {time}
                        </option>
                      )
                    )}
                  </select>
                </motion.div>

                {/* Selected Services Summary */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-8 p-6 bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/30 rounded-2xl"
                >
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-violet-400" />
                    Selected Services
                  </h3>
                  {selectedServices.size > 0 ? (
                    <div className="space-y-3">
                      {services
                        .filter((s) => selectedServices.has(s.id))
                        .map((service, idx) => (
                          <motion.div
                            key={service.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex justify-between text-slate-300 text-sm"
                          >
                            <span>{service.name}</span>
                            <span className="font-semibold text-violet-300">
                              ${service.price}
                            </span>
                          </motion.div>
                        ))}
                      <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-white">
                        <span>Total:</span>
                        <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent text-lg">
                          ${totalPrice}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">Select services to see total</p>
                  )}
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBooking}
                  disabled={isBooking || selectedServices.size === 0}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Book Now
                      <ChevronRight size={20} />
                    </>
                  )}
                </motion.button>

                <motion.p className="text-xs text-slate-400 text-center mt-4">
                  💳 Secure payment powered by Stripe
                </motion.p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
