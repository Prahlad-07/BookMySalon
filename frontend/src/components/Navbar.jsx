/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-16
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, MessageCircle, Moon, Sun, X } from 'lucide-react';
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
  `px-3 py-2 rounded-lg text-sm font-semibold transition ${
    isActive
      ? 'text-primary-700 bg-primary-50 border border-primary-100'
      : 'text-slate-700 hover:text-primary-700 hover:bg-slate-100/70 border border-transparent'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `block px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
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

  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const roleLinks = user ? getRoleLinks(user.role) : [];

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const loadNotifications = async () => {
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
    }
  };

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
    <nav className="sticky top-0 z-50 nav-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3" aria-label="BookMySalon home">
            <img src={brandLogo} alt="BookMySalon" className="brand-logo-main" />
          </Link>

          <div className="hidden md:flex items-center gap-2">
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
              <>
                <NavLink to="/chat" className={desktopLinkClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle size={15} /> Chat
                  </span>
                </NavLink>

                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-primary-700 hover:bg-slate-100/70 border border-transparent inline-flex items-center gap-1.5"
                    onClick={() => {
                      setShowNotifications((previous) => !previous);
                      loadNotifications();
                    }}
                  >
                    <Bell size={15} /> Alerts
                    {unreadCount > 0 && (
                      <span className="text-[10px] leading-none rounded-full bg-red-500 text-white px-1.5 py-1 min-w-[1.1rem] text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl surface-card p-2 z-50">
                      <p className="px-2 pt-1 pb-2 text-xs font-semibold text-slate-500">Latest alerts</p>
                      <div className="space-y-1 max-h-80 overflow-auto pr-1">
                        {notifications.length === 0 && (
                          <p className="px-2 py-4 text-sm text-slate-500">No notifications yet.</p>
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
                                isRead
                                  ? 'surface-muted border-slate-200'
                                  : 'bg-primary-50 border-primary-200'
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
                    </div>
                  )}
                </div>

                <NavLink to="/profile" className={desktopLinkClass}>
                  Profile
                </NavLink>

                <button type="button" onClick={handleLogout} className="btn-primary !py-2.5 inline-flex items-center gap-2">
                  <LogOut size={15} /> Logout
                </button>
              </>
            )}

            {!user && (
              <>
                <NavLink to="/login" className={desktopLinkClass}>
                  Login
                </NavLink>
                <NavLink to="/signup" className="btn-primary !py-2.5">
                  Sign Up
                </NavLink>
              </>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn ml-1"
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            {user && unreadCount > 0 && <span className="status-pill status-danger">{unreadCount} alerts</span>}
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
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
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
                  Login
                </NavLink>
                <NavLink to="/signup" className="btn-primary w-full block text-center mt-2" onClick={() => setIsOpen(false)}>
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
