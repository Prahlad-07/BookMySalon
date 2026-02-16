import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import SalonOwnerRoute from './components/SalonOwnerRoute';
import CustomerRoute from './components/CustomerRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SalonList from './pages/SalonList';
import SalonDetail from './pages/SalonDetail';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import SalonOwnerDashboard from './pages/SalonOwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ChatRoute = lazy(() => import('./pages/ChatRoute'));

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

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
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading chat...</div>}>
                      <ChatRoute />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:participantId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading chat...</div>}>
                      <ChatRoute />
                    </Suspense>
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
                        <a href="/" className="btn-primary inline-block">Go Home</a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </main>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}
