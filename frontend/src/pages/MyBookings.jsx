import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/api/bookings/customer');
      setBookings(response.data);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"
        ></motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            My <span className="gradient-text">Bookings</span>
          </h1>
          <p className="text-lg text-secondary-600">
            Manage your salon appointments
          </p>
        </motion.div>

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {bookings.map((booking) => (
              <motion.div
                key={booking.id}
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-primary-600"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                      {booking.salonName || 'Salon Name'}
                    </h2>
                    <p className="text-secondary-600">
                      Booking ID: #{booking.id}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <Calendar className="text-primary-600 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-secondary-600 font-medium">Date</p>
                      <p className="text-lg font-semibold text-secondary-900">
                        {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <Clock className="text-primary-600 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-secondary-600 font-medium">Time</p>
                      <p className="text-lg font-semibold text-secondary-900">
                        {booking.startTime}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary-600 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-secondary-600 font-medium">Location</p>
                      <p className="text-lg font-semibold text-secondary-900">
                        {booking.salonCity || 'City'}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-start gap-3">
                    <DollarSign className="text-primary-600 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-secondary-600 font-medium">Price</p>
                      <p className="text-lg font-semibold text-secondary-900">
                        ${booking.totalPrice || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-6 pb-6 border-b border-secondary-200">
                  <h3 className="font-bold text-secondary-900 mb-3">Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {booking.services && booking.services.length > 0 ? (
                      booking.services.map((service, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-secondary-700"
                        >
                          <CheckCircle size={16} className="text-green-500" />
                          <span>{service.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-secondary-600">Service details coming soon</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex-1"
                  >
                    Reschedule
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary flex-1"
                  >
                    Add Review
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <p className="text-2xl text-secondary-600 mb-4">No bookings yet</p>
            <p className="text-secondary-500 mb-8">Start booking your favorite salon services</p>
            <a
              href="/salons"
              className="btn-primary inline-block"
            >
              Find Salons
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
