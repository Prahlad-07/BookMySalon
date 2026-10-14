import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Link, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import DemoModeBanner from './components/DemoModeBanner';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import SalonOwnerRoute from './components/SalonOwnerRoute';
import CustomerRoute from './components/CustomerRoute';
import AdminRoute from './components/AdminRoute';
import RouteEffects from './components/RouteEffects';
import { PageLoader } from './components/ui';
import { useT } from './i18n';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SalonList = lazy(() => import('./pages/SalonList'));
const SalonDetail = lazy(() => import('./pages/SalonDetail'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const Profile = lazy(() => import('./pages/Profile'));
const SalonOwnerDashboard = lazy(() => import('./pages/SalonOwnerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ChatRoute = lazy(() => import('./pages/ChatRoute'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));

const CHROMELESS_FOOTER = ['/login', '/signup', '/forgot-password', '/reset-password', '/oauth/callback', '/chat'];

function FooterSlot() {
  const { pathname } = useLocation();
  if (CHROMELESS_FOOTER.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return <Footer />;
}

function NotFound() {
  const t = useT();
  return (
    <div className="shell flex min-h-[70vh] flex-col items-start justify-center py-24">
      <p className="eyebrow">{t('notFound.eyebrow')}</p>
      <h1 className="display mt-4 text-[36px] text-ink sm:text-[44px]">{t('notFound.title')}</h1>
      <p className="lede mt-4 max-w-md">{t('notFound.body')}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/" className="btn-dark">
          {t('notFound.home')}
        </Link>
        <Link to="/salons" className="btn-secondary">
          {t('notFound.browse')}
        </Link>
      </div>
    </div>
  );
}

function SkipLink() {
  const t = useT();
  return (
    <a href="#main-content" className="skip-link">
      {t('nav.skip')}
    </a>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <RouteEffects />
        <SkipLink />
        <div className="flex min-h-screen flex-col">
          <DemoModeBanner />
          <Navbar />

          <main id="main-content" className="flex-1" tabIndex="-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Browsing is public; booking, reviews and chat still require sign-in. */}
                <Route path="/salons" element={<SalonList />} />
                <Route path="/customer/dashboard" element={<SalonList />} />
                <Route path="/salon/:salonId" element={<SalonDetail />} />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <CustomerRoute>
                        <MyBookings />
                      </CustomerRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/salon/dashboard"
                  element={
                    <ProtectedRoute>
                      <SalonOwnerRoute>
                        <SalonOwnerDashboard />
                      </SalonOwnerRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                {['/chat', '/chat/:participantId'].map((path) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <ProtectedRoute>
                        <ChatRoute />
                      </ProtectedRoute>
                    }
                  />
                ))}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/success"
                  element={
                    <ProtectedRoute>
                      <PaymentResult outcome="success" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/cancel"
                  element={
                    <ProtectedRoute>
                      <PaymentResult outcome="cancel" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={<NotFound />}
                />
              </Routes>
            </Suspense>
          </main>

          <FooterSlot />
        </div>
      </AuthProvider>
    </Router>
  );
}
