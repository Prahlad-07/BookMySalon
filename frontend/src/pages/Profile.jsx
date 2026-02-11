import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary-600">Please login to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            My <span className="gradient-text">Profile</span>
          </h1>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-5xl">👤</span>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Full Name
              </label>
              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <User className="text-secondary-400" size={20} />
                <p className="text-lg text-secondary-900">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <Mail className="text-secondary-400" size={20} />
                <p className="text-lg text-secondary-900">{user.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Phone Number
              </label>
              <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
                <Phone className="text-secondary-400" size={20} />
                <p className="text-lg text-secondary-900">{user.phone || 'Not provided'}</p>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Account Type
              </label>
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-lg font-semibold text-primary-700">
                  {user.role === 'SALON_OWNER' ? '💼 Salon Owner' : '👤 Customer'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary w-full"
            >
              Edit Profile
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="btn-primary w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <LogOut size={20} />
              Logout
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
