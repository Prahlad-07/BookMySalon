/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React from 'react';
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8">My <span className="gradient-text">Profile</span></h1>

        <div className="card-base p-8">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-4xl shadow-lg">
              {user.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Full Name</label>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <User size={20} className="text-slate-500" />
                <p className="text-slate-900 font-semibold">{user.fullName || user.name || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Email</label>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <Mail size={20} className="text-slate-500" />
                <p className="text-slate-900 font-semibold">{user.email || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Phone</label>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <Phone size={20} className="text-slate-500" />
                <p className="text-slate-900 font-semibold">{user.phone || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Account Type</label>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-blue-800 font-semibold">
                  {user.role === 'SALON_OWNER' ? 'Salon Owner' : user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                </p>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
