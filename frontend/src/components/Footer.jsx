/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React from 'react';
import { Mail, Phone, MapPin, Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_PROFILE } from '../config/site';
import brandLogo from '../assets/brand-logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-surface mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <img src={brandLogo} alt="BookMySalon" className="footer-brand-main" />
            <p className="footer-link text-sm leading-6 mt-4">
              Book appointments, manage salon operations, and keep every customer interaction in one streamlined platform.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/customer/dashboard" className="footer-link">
                  Find Salons
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="footer-link">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/profile" className="footer-link">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="footer-link">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 footer-link text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-slate-300" />
                Founder: {SITE_PROFILE.founderName}
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-slate-300" />
                {SITE_PROFILE.phone}
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-300 mt-0.5" />
                <a href={SITE_PROFILE.locationUrl} target="_blank" rel="noreferrer" className="footer-link">
                  {SITE_PROFILE.locationLabel}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap border-t border-slate-700/70 pt-6">
          <p className="footer-link text-sm">&copy; {currentYear} BookMySalon. All rights reserved.</p>
          <div className="flex gap-3">
            <a
              href={SITE_PROFILE.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href={SITE_PROFILE.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center"
              aria-label="GitHub"
            >
              <Github size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
