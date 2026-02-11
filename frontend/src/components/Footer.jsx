import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="bg-gradient-to-b from-secondary-900 to-secondary-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"
        >
          {/* Brand */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <span className="font-bold text-xl">BookMySalon</span>
            </div>
            <p className="text-secondary-400">
              Your premier platform for booking salon services with ease and confidence.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-secondary-400">
              <li>
                <a href="/" className="hover:text-primary-400 transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/salons" className="hover:text-primary-400 transition">
                  Find Salons
                </a>
              </li>
              <li>
                <a href="/bookings" className="hover:text-primary-400 transition">
                  My Bookings
                </a>
              </li>
              <li>
                <a href="/profile" className="hover:text-primary-400 transition">
                  Profile
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-secondary-400">
              <li>
                <a href="#" className="hover:text-primary-400 transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-secondary-400">
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-primary-400" />
                <span>info@bookmysalon.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary-400" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary-400 mt-1" />
                <span>123 Salon Street, Beauty City, BC 12345</span>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Social Media */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-4 mb-8 pb-8 border-b border-secondary-700"
        >
          <a
            href="#"
            className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center hover:bg-primary-500 transition"
          >
            <Facebook size={20} />
          </a>
          <a
            href="#"
            className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center hover:bg-primary-500 transition"
          >
            <Instagram size={20} />
          </a>
          <a
            href="#"
            className="w-10 h-10 rounded-full bg-secondary-800 flex items-center justify-center hover:bg-primary-500 transition"
          >
            <Twitter size={20} />
          </a>
        </motion.div>

        {/* Copyright */}
        <div className="text-center text-secondary-400">
          <p>&copy; {currentYear} BookMySalon. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
