/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, LogOut, Menu, MessageCircle, Moon, Sparkles, Sun, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import { useTheme } from '../context/ThemeContext';
import brandLogo from '../assets/brand-logo.png';

const getRoleLinks = (role) => {
  if (role === 'SALON_OWNER') {
    return [
      { to: '/salon/dashboard', label: 'Owner Console' },
      { to: '/salons', label: 'Find Salons' },
      { to: '/bookings', label: 'My Bookings' },
    ];
  }

  if (role === 'ADMIN') {
    return [{ to: '/admin/dashboard', label: 'Admin Dashboard' }];
  }

  return [
    { to: '/customer/dashboard', label: 'Customer Dashboard' },
    { to: '/salons', label: 'Find Salons' },
    { to: '/bookings', label: 'My Bookings' },
  ];
};

const desktopLinkClass = ({ isActive }) =>
  `inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition ${
    isActive
      ? 'text-primary-700 bg-primary-50 border border-primary-100 shadow-sm'
      : 'text-slate-700 hover:text-primary-700 hover:bg-white/70 border border-transparent'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `block px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
    isActive
      ? 'text-primary-700 bg-primary-50 border border-primary-100'
      : 'text-slate-700 hover:text-primary-700 hover:bg-slate-100/70 border border-transparent'
  }`;

const normalizeNotificationType = (type) => String(type || 'NOTIFICATION').replaceAll('_', ' ');

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const roleLinks = user ? getRoleLinks(user.role) : [];

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setShowNotifications(false);
    navigate('/');
  };

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const [counts, list] = await Promise.all([
        api.get('/api/chat/unread-count'),
        api.get('/api/chat/notifications?limit=10'),
      ]);

      const unreadMessages = Number(counts?.unreadMessages || 0);
      const unreadNotifications = Number(counts?.unreadNotifications || 0);
      setUnreadCount(unreadMessages + unreadNotifications);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (_) {
      // Swallow transient polling errors; navbar remains usable.
    }
  }, [user]);

  const markNotificationRead = async (notificationId) => {
    try {
      await api.put(`/api/chat/notifications/${notificationId}/read`);
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                wasRead: true,
              }
            : item
        )
      );
      setUnreadCount((previous) => Math.max(previous - 1, 0));
    } catch (_) {
      // Notification read failures should not block navigation.
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [user, loadNotifications]);

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

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 nav-surface ${isScrolled ? 'nav-surface-scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[4.6rem] flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="BookMySalon home">
            <img src={brandLogo} alt="BookMySalon" className="brand-logo-main" />
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-[0.95rem] font-semibold text-slate-900">BookMySalon</span>
              <span className="text-[0.68rem] uppercase tracking-[0.14em] text-slate-500">Smart booking platform</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 min-w-0">
            <NavLink to="/" className={desktopLinkClass}>
              Home
            </NavLink>

            {user &&
              roleLinks.map((item) => (
                <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                  {item.label}
                </NavLink>
              ))}

            {user && (
              <NavLink to="/chat" className={desktopLinkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle size={15} /> Chat
                </span>
              </NavLink>
            )}

            {!user && (
              <>
                <NavLink to="/login" className={desktopLinkClass}>
                  Sign In
                </NavLink>
                <NavLink to="/signup" className="btn-primary !px-4 !py-2.5">
                  Sign Up
                </NavLink>
              </>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {user && (
              <>
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    className="relative inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-700 hover:bg-white/80"
                    onClick={() => {
                      setShowNotifications((previous) => !previous);
                      loadNotifications();
                    }}
                  >
                    <Bell size={15} />
                    Alerts
                    {unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 min-w-[1.1rem] rounded-full bg-red-500 px-1.5 py-[2px] text-[10px] font-bold leading-none text-white text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl surface-card p-2 z-50"
                      >
                        <p className="px-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Recent alerts
                        </p>
                        <div className="space-y-1 max-h-80 overflow-auto pr-1">
                          {notifications.length === 0 && (
                            <p className="px-2 py-4 text-sm text-slate-500">No alerts yet.</p>
                          )}

                          {notifications.map((item) => {
                            const isRead = Boolean(item.wasRead);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  if (!isRead) {
                                    markNotificationRead(item.id);
                                  }
                                  setShowNotifications(false);
                                  if (item.conversationId) {
                                    navigate('/chat');
                                  }
                                }}
                                className={`w-full text-left p-2.5 rounded-lg border transition ${
                                  isRead ? 'surface-muted border-slate-200' : 'bg-primary-50 border-primary-200'
                                }`}
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                  {normalizeNotificationType(item.type)}
                                </p>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <NavLink to="/profile" className={desktopLinkClass}>
                  Profile
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-primary !px-4 !py-2.5 inline-flex items-center gap-1.5"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            {user && unreadCount > 0 && (
              <span className="status-pill status-danger inline-flex items-center gap-1.5">
                <Sparkles size={12} />
                {unreadCount}
              </span>
            )}
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
              type="button"
              onClick={() => setIsOpen((previous) => !previous)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden py-3 border-t border-slate-200 space-y-1"
            >
              <NavLink to="/" className={mobileLinkClass} onClick={() => setIsOpen(false)}>
                Home
              </NavLink>

              {user &&
                roleLinks.map((item) => (
                  <NavLink key={item.to} to={item.to} className={mobileLinkClass} onClick={() => setIsOpen(false)}>
                    {item.label}
                  </NavLink>
                ))}

              {user ? (
                <>
                  <NavLink to="/chat" className={mobileLinkClass} onClick={() => setIsOpen(false)}>
                    Chat
                  </NavLink>
                  <NavLink to="/profile" className={mobileLinkClass} onClick={() => setIsOpen(false)}>
                    Profile
                  </NavLink>
                  <button type="button" onClick={handleLogout} className="btn-primary w-full mt-2">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={mobileLinkClass} onClick={() => setIsOpen(false)}>
                    Sign In
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className="btn-primary w-full block text-center mt-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </NavLink>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
