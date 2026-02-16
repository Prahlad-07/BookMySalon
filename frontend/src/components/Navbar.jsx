import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLinks = user
    ? user.role === 'SALON_OWNER'
      ? [{ to: '/salon/dashboard', label: 'Owner Console' }]
      : user.role === 'ADMIN'
        ? [{ to: '/admin/dashboard', label: 'Admin Dashboard' }]
        : [
            { to: '/salons', label: 'Find Salons' },
            { to: '/bookings', label: 'My Bookings' },
          ]
    : [];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/85 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold flex items-center justify-center shadow-md">
              B
            </div>
            <span className="gradient-text text-xl font-extrabold hidden sm:inline">BookMySalon</span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700">
            <Link to="/" className="hover:text-blue-700">Home</Link>
            {user ? (
              <>
                {roleLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="hover:text-blue-700">
                    {item.label}
                  </Link>
                ))}
                <Link to="/chat" className="hover:text-blue-700 flex items-center gap-1">
                  <MessageCircle size={16} />
                  Chat
                </Link>
                <Link to="/profile" className="hover:text-blue-700">Profile</Link>
                <button onClick={handleLogout} className="btn-primary flex items-center gap-2 !py-2">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-700">Login</Link>
                <Link to="/signup" className="btn-primary !py-2">Sign Up</Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-3 border-t border-blue-100 space-y-1 text-sm font-medium">
            <Link to="/" className="block px-2 py-2 text-slate-700" onClick={() => setIsOpen(false)}>Home</Link>
            {user ? (
              <>
                {roleLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="block px-2 py-2 text-slate-700" onClick={() => setIsOpen(false)}>
                    {item.label}
                  </Link>
                ))}
                <Link to="/chat" className="block px-2 py-2 text-slate-700" onClick={() => setIsOpen(false)}>
                  Chat
                </Link>
                <Link to="/profile" className="block px-2 py-2 text-slate-700" onClick={() => setIsOpen(false)}>Profile</Link>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="btn-primary w-full"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-2 py-2 text-slate-700" onClick={() => setIsOpen(false)}>Login</Link>
                <Link to="/signup" className="btn-primary w-full text-center block mt-2" onClick={() => setIsOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
