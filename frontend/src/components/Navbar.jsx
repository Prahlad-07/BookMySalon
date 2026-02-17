/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, LogOut, MessageCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

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

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const [counts, list] = await Promise.all([
        api.get('/api/chat/unread-count'),
        api.get('/api/chat/notifications?limit=8'),
      ]);

      setUnreadCount((counts?.unreadMessages || 0) + (counts?.unreadNotifications || 0));
      setNotifications(Array.isArray(list) ? list : []);
    } catch (_) {
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await api.put(`/api/chat/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, wasRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (_) {
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

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
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
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
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    className="hover:text-blue-700 flex items-center gap-1"
                    onClick={() => {
                      setShowNotifications((prev) => !prev);
                      loadNotifications();
                    }}
                  >
                    <Bell size={16} />
                    Alerts
                    {unreadCount > 0 && (
                      <span className="ml-1 text-[10px] rounded-full bg-red-500 text-white px-1.5 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50">
                      <p className="px-2 py-1 text-xs font-semibold text-slate-500">Notifications</p>
                      <div className="max-h-72 overflow-auto space-y-1">
                        {notifications.length === 0 && (
                          <p className="px-2 py-3 text-sm text-slate-500">No notifications yet.</p>
                        )}
                        {notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (!item.wasRead) markNotificationRead(item.id);
                              if (item.conversationId) navigate('/chat');
                            }}
                            className={`w-full text-left px-2 py-2 rounded-lg border ${
                              item.wasRead ? 'bg-white border-slate-100' : 'bg-blue-50 border-blue-100'
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-700">{item.type?.replaceAll('_', ' ') || 'NOTIFICATION'}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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

          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
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
