import React from 'react';
import { Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../utils/roleRouting';

const roleMeta = {
  CUSTOMER: {
    label: 'Customer',
    statusClass: 'status-pill status-success',
  },
  SALON_OWNER: {
    label: 'Salon Owner',
    statusClass: 'status-pill status-pending',
  },
  ADMIN: {
    label: 'Admin',
    statusClass: 'status-pill status-danger',
  },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card-base rounded-2xl p-8 text-center">
          <p className="text-slate-700">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  const normalizedRole = getRoleLabel(user.role);
  const roleInfo = roleMeta[normalizedRole] || roleMeta.CUSTOMER;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600 mt-2">Account details and access role.</p>
        </div>

        <div className="card-base rounded-3xl p-8 space-y-7">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="inline-flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center shadow-lg">
                <User size={28} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{user.firstName || user.name || 'BookMySalon User'}</p>
                <p className="text-sm text-slate-600">{user.email || 'No email available'}</p>
              </div>
            </div>
            <span className={roleInfo.statusClass}>{roleInfo.label}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-muted rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</p>
              <p className="mt-2 font-semibold text-slate-900 flex items-center gap-2">
                <User size={16} className="text-slate-500" />
                {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not provided'}
              </p>
            </div>

            <div className="surface-muted rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
              <p className="mt-2 font-semibold text-slate-900 flex items-center gap-2 break-all">
                <Mail size={16} className="text-slate-500" />
                {user.email || 'Not provided'}
              </p>
            </div>

            <div className="surface-muted rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</p>
              <p className="mt-2 font-semibold text-slate-900 flex items-center gap-2">
                <Phone size={16} className="text-slate-500" />
                {user.phone || 'Not provided'}
              </p>
            </div>

            <div className="surface-muted rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Access Role</p>
              <p className="mt-2 font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-slate-500" />
                {roleInfo.label}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/')} className="btn-secondary">
              Back to Home
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
