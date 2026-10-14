import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useT } from '../i18n';

const PAGE_TITLES = {
  '/': 'title.home',
  '/login': 'title.login',
  '/signup': 'title.signup',
  '/salons': 'title.salons',
  '/customer/dashboard': 'title.salons',
  '/bookings': 'title.bookings',
  '/salon/dashboard': 'title.workspace',
  '/admin/dashboard': 'title.admin',
  '/chat': 'title.chat',
  '/profile': 'title.profile',
  '/forgot-password': 'title.forgot',
  '/reset-password': 'title.reset',
};

export default function RouteEffects() {
  const { pathname } = useLocation();
  const t = useT();

  useEffect(() => {
    document.title = PAGE_TITLES[pathname] ? `${t(PAGE_TITLES[pathname])} · BookMySalon` : 'BookMySalon';
  }, [pathname, t]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });

    const main = document.getElementById('main-content');
    main?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
