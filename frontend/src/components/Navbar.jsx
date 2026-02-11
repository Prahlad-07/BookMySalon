import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-secondary-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="gradient-text font-bold text-xl hidden sm:inline">
              BookMySalon
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-secondary-700 hover:text-primary-600 transition">
              Home
            </Link>
            {user ? (
              <>
                {user.role === 'SALON_OWNER' ? (
                  <>
                    <Link
                      to="/salon/dashboard"
                      className="text-secondary-700 hover:text-primary-600 transition"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/salon/bookings"
                      className="text-secondary-700 hover:text-primary-600 transition"
                    >
                      Bookings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/bookings"
                      className="text-secondary-700 hover:text-primary-600 transition"
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/salons"
                      className="text-secondary-700 hover:text-primary-600 transition"
                    >
                      Find Salons
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="text-secondary-700 hover:text-primary-600 transition"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-primary flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-secondary-700 hover:text-primary-600 transition">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-secondary-100 rounded-lg transition"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            className="md:hidden pb-4 border-t border-secondary-200"
          >
            <motion.div variants={itemVariants}>
              <Link
                to="/"
                className="block px-4 py-2 text-secondary-700 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
            </motion.div>

            {user ? (
              <>
                {user.role === 'SALON_OWNER' ? (
                  <>
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/salon/dashboard"
                        className="block px-4 py-2 text-secondary-700 hover:text-primary-600"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/salon/bookings"
                        className="block px-4 py-2 text-secondary-700 hover:text-primary-600"
                        onClick={() => setIsOpen(false)}
                      >
                        Bookings
                      </Link>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/bookings"
                        className="block px-4 py-2 text-secondary-700 hover:text-primary-600"
                        onClick={() => setIsOpen(false)}
                      >
                        My Bookings
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/salons"
                        className="block px-4 py-2 text-secondary-700 hover:text-primary-600"
                        onClick={() => setIsOpen(false)}
                      >
                        Find Salons
                      </Link>
                    </motion.div>
                  </>
                )}
                <motion.div variants={itemVariants}>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-secondary-700 hover:text-primary-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants} className="px-4 py-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={itemVariants}>
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-secondary-700 hover:text-primary-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants} className="px-4 py-2">
                  <Link to="/signup" className="btn-primary w-full text-center block">
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
}
