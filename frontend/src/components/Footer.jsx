/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React from 'react';
import { Github, Linkedin, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_PROFILE } from '../config/site';
import brandLogo from '../assets/brand-logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-surface mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={brandLogo} alt="BookMySalon" className="footer-brand-main !h-12 !rounded-xl" />
              <div>
                <p className="text-white font-semibold">BookMySalon</p>
                <p className="text-xs uppercase tracking-[0.14em] footer-link">Growth-ready salon operating system</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/85">
              <Sparkles size={13} />
              Built for customers, owners, and admins
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <p className="footer-link text-sm leading-7 max-w-md">
                From discovery to checkout to operations, BookMySalon keeps booking fast and salon management fully
                under control.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
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
                  <Link to="/chat" className="footer-link">
                    Messages
                  </Link>
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
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap border-t border-slate-700/60 mt-8 pt-6">
          <p className="footer-link text-sm">&copy; {currentYear} BookMySalon. All rights reserved.</p>
          <div className="flex gap-3">
            <a
              href={SITE_PROFILE.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-white/15 bg-slate-700/30 text-slate-300 hover:text-white hover:bg-slate-700/70 flex items-center justify-center"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href={SITE_PROFILE.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full border border-white/15 bg-slate-700/30 text-slate-300 hover:text-white hover:bg-slate-700/70 flex items-center justify-center"
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
