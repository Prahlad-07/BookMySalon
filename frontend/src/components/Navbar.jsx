/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-16
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../config/api';
import { Avatar, Wordmark } from './ui';
import LanguageSwitcher from './LanguageSwitcher';
import { useT } from '../i18n';
import { relativeTime } from '../i18n/format';

const linksFor = (role) => {
  if (role === 'SALON_OWNER') {
    return [
      { to: '/salon/dashboard', label: 'nav.workspace' },
      { to: '/salons', label: 'nav.marketplace' },
      { to: '/chat', label: 'nav.messages' },
    ];
  }
  if (role === 'ADMIN') {
    return [
      { to: '/admin/dashboard', label: 'nav.overview' },
      { to: '/salons', label: 'nav.salons' },
    ];
  }
  return [
    { to: '/salons', label: 'nav.discover' },
    { to: '/bookings', label: 'nav.appointments' },
    { to: '/chat', label: 'nav.messages' },
  ];
};

const NOTIFICATION_TYPES = ['NEW_MESSAGE', 'BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION'];

function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, onClose]);
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const t = useT();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const bellRef = useRef(null);
  const menuRef = useRef(null);
  const closeBell = useCallback(() => setBellOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismiss(bellRef, bellOpen, closeBell);
  useDismiss(menuRef, menuOpen, closeMenu);

  useEffect(() => {
    setMobileOpen(false);
    setBellOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [counts, list] = await Promise.all([
        api.get('/api/chat/unread-count'),
        api.get('/api/chat/notifications?limit=12'),
      ]);
      setUnreadMessages(Number(counts?.unreadMessages || 0));
      setUnreadNotifications(Number(counts?.unreadNotifications || 0));
      setNotifications(Array.isArray(list) ? list : []);
    } catch (_) {
      // Navigation must keep working when the counter endpoint is briefly unavailable.
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return undefined;
    }
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user, load]);

  const openNotification = async (item) => {
    setBellOpen(false);
    if (!item.wasRead) {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, wasRead: true } : n)));
      setUnreadNotifications((n) => Math.max(0, n - 1));
      api.put(`/api/chat/notifications/${item.id}/read`).catch(() => {});
    }
    if (item.conversationId) navigate('/chat');
    else if (item.bookingId) navigate(user?.role === 'SALON_OWNER' ? '/salon/dashboard' : '/bookings');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = user ? linksFor(user.role) : [];

  const linkClass = ({ isActive }) =>
    `relative py-1 text-[14px] font-medium transition-colors ${
      isActive
        ? 'text-ink after:absolute after:-bottom-[21px] after:left-0 after:right-0 after:h-[2px] after:bg-ink'
        : 'text-ink-2 hover:text-ink'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Wordmark />
          {user && (
            <nav aria-label={t('nav.primary')} className="hidden items-center gap-7 md:flex">
              {links.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  {t(item.label)}
                  {item.to === '/chat' && unreadMessages > 0 && (
                    <span className="num ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10.5px] font-semibold text-accent-ink">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={isDark ? t('nav.lightTheme') : t('nav.darkTheme')}
          >
            {isDark ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
          </button>

          {user ? (
            <>
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  className="icon-btn relative"
                  onClick={() => {
                    setBellOpen((v) => !v);
                    setMenuOpen(false);
                    if (!bellOpen) load();
                  }}
                  aria-label={
                    unreadNotifications
                      ? `${t('nav.notifications')}, ${t('nav.unread', { count: unreadNotifications })}`
                      : t('nav.notifications')
                  }
                  aria-expanded={bellOpen}
                >
                  <Bell size={17} strokeWidth={1.75} />
                  {unreadNotifications > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-paper" />
                  )}
                </button>

                {bellOpen && (
                  <div className="animate-fade absolute right-0 top-11 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <p className="text-sm font-semibold">{t('nav.notifications')}</p>
                      {unreadNotifications > 0 && (
                        <span className="text-xs text-ink-3">{t('nav.unread', { count: unreadNotifications })}</span>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-auto scrollbar-thin">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-ink-3">{t('nav.caughtUp')}</p>
                      ) : (
                        notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => openNotification(item)}
                            className="flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-sunken"
                          >
                            <span
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.wasRead ? 'bg-transparent' : 'bg-accent'}`}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2">
                                <span className="text-[13px] font-semibold text-ink">
                                  {NOTIFICATION_TYPES.includes(item.type) ? t(`notify.${item.type}`) : t('notify.UPDATE')}
                                </span>
                                <span className="shrink-0 text-[11.5px] text-ink-3">{relativeTime(item.createdAt)}</span>
                              </span>
                              <span className="mt-0.5 block truncate text-[13px] text-ink-2">{item.description}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative ml-1" ref={menuRef}>
                <button
                  type="button"
                  className="flex items-center rounded-full p-0.5 transition hover:ring-2 hover:ring-line"
                  onClick={() => {
                    setMenuOpen((v) => !v);
                    setBellOpen(false);
                  }}
                  aria-label={t('nav.accountMenu')}
                  aria-expanded={menuOpen}
                >
                  <Avatar name={user.fullName || user.name || user.email} size={32} />
                </button>

                {menuOpen && (
                  <div className="animate-fade absolute right-0 top-11 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
                    <div className="border-b border-line px-4 py-3.5">
                      <p className="truncate text-sm font-semibold">{user.fullName || user.name}</p>
                      <p className="truncate text-[13px] text-ink-3">{user.email}</p>
                      <p className="eyebrow mt-2 !text-[10px]">{t(`role.${user.role || 'MEMBER'}`)}</p>
                    </div>
                    <div className="p-1.5">
                      <Link to="/profile" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-2 hover:bg-sunken hover:text-ink">
                        <UserRound size={16} strokeWidth={1.75} /> {t('nav.accountSettings')}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-2 hover:bg-sunken hover:text-ink"
                      >
                        <LogOut size={16} strokeWidth={1.75} /> {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="icon-btn ml-1 md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
            </>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link to="/login" className="btn-ghost btn-sm hidden sm:inline-flex">
                {t('nav.signIn')}
              </Link>
              <Link to="/signup" className="btn-dark btn-sm">
                {t('nav.getStarted')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {user && mobileOpen && (
        <nav aria-label={t('nav.mobile')} className="animate-fade border-t border-line bg-paper md:hidden">
          <div className="shell flex flex-col py-2">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between border-b border-line py-3.5 text-[15px] last:border-0 ${
                    isActive ? 'font-semibold text-ink' : 'text-ink-2'
                  }`
                }
              >
                {t(item.label)}
                {item.to === '/chat' && unreadMessages > 0 && <span className="tag-accent">{unreadMessages}</span>}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
