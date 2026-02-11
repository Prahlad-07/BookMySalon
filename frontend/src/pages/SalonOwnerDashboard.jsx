import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react';
import api from '../config/api';

export default function SalonOwnerDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalServices: 0,
    totalReviews: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const reportResponse = await api.get('/api/bookings/report');
      setStats({
        totalBookings: reportResponse.data.totalBookings || 0,
        totalRevenue: reportResponse.data.totalRevenue || 0,
        totalServices: reportResponse.data.serviceCount || 0,
        totalReviews: reportResponse.data.reviewCount || 0,
      });

      const bookingsResponse = await api.get('/api/bookings/salon');
      setRecentBookings(bookingsResponse.data.slice(0, 5) || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
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

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -10 }}
      className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${color}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-secondary-600 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-secondary-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('border', 'bg').replace('left', '')}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </motion.div>
  );

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-secondary-600">
            Welcome back! Here's your salon overview
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <StatCard
            icon={Calendar}
            title="Total Bookings"
            value={stats.totalBookings}
            color="border-primary-600 bg-primary-50"
          />
          <StatCard
            icon={DollarSign}
            title="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            color="border-green-600 bg-green-50"
          />
          <StatCard
            icon={Activity}
            title="Services Offered"
            value={stats.totalServices}
            color="border-blue-600 bg-blue-50"
          />
          <StatCard
            icon={Users}
            title="Customer Reviews"
            value={stats.totalReviews}
            color="border-yellow-600 bg-yellow-50"
          />
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2">
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-secondary-900 mb-6">
                Recent Bookings
              </h2>

              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-primary-50 transition"
                    >
                      <div>
                        <p className="font-bold text-secondary-900">
                          Booking #{booking.id}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-secondary-900">
                          ${booking.totalPrice}
                        </p>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary-600 text-center py-8">
                  No recent bookings
                </p>
              )}
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-primary-50 to-pink-50 rounded-2xl shadow-lg p-8 border border-primary-200"
          >
            <h3 className="text-xl font-bold text-secondary-900 mb-6">
              Quick Actions
            </h3>

            <div className="space-y-3">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/salon/services"
                className="btn-primary block text-center py-3"
              >
                Manage Services
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/salon/bookings"
                className="btn-secondary block text-center py-3"
              >
                View All Bookings
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/salon/profile"
                className="btn-secondary block text-center py-3"
              >
                Edit Profile
              </motion.a>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-white rounded-lg border-2 border-primary-200">
              <p className="text-sm text-secondary-700">
                <span className="font-bold">💡 Tip:</span> Update your services and
                availability regularly to get more bookings!
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
