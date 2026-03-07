import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import SalonOwnerRoute from './components/SalonOwnerRoute';
import CustomerRoute from './components/CustomerRoute';
import AdminRoute from './components/AdminRoute';

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

function RouteLoader() {
  return (
    <div className="min-h-[55vh] flex items-center justify-center">
      <div className="inline-flex items-center gap-3 card-base rounded-xl px-4 py-3 text-slate-700">
        <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />

          <main className="flex-1">
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route
                  path="/salons"
                  element={
                    <ProtectedRoute>
                      <CustomerRoute>
                        <SalonList />
                      </CustomerRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/dashboard"
                  element={
                    <ProtectedRoute>
                      <CustomerRoute>
                        <SalonList />
                      </CustomerRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/salon/:salonId"
                  element={
                    <ProtectedRoute>
                      <CustomerRoute>
                        <SalonDetail />
                      </CustomerRoute>
                    </ProtectedRoute>
                  }
                />
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

                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatRoute />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat/:participantId"
                  element={
                    <ProtectedRoute>
                      <ChatRoute />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-secondary-900 mb-4">404</h1>
                        <p className="text-lg text-secondary-600 mb-8">Page not found</p>
                        <Link to="/" className="btn-primary inline-block">
                          Go Home
                        </Link>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}
