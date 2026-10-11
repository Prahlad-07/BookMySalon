import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'BookMySalon — Book the salon you will love',
  '/login': 'Sign in · BookMySalon',
  '/signup': 'Create account · BookMySalon',
  '/salons': 'Discover salons · BookMySalon',
  '/customer/dashboard': 'Discover salons · BookMySalon',
  '/bookings': 'Appointments · BookMySalon',
  '/salon/dashboard': 'Workspace · BookMySalon',
  '/admin/dashboard': 'Platform overview · BookMySalon',
  '/chat': 'Messages · BookMySalon',
  '/profile': 'Account · BookMySalon',
  '/forgot-password': 'Reset password · BookMySalon',
  '/reset-password': 'New password · BookMySalon',
};

export default function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = PAGE_TITLES[pathname] || 'BookMySalon';
    window.scrollTo({ top: 0, behavior: 'auto' });

    const main = document.getElementById('main-content');
    main?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
