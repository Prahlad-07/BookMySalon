/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React from 'react';
import { Mail, Phone, MapPin, Github, Linkedin } from 'lucide-react';
import { SITE_PROFILE } from '../config/site';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-200 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <span className="font-bold text-xl text-white">BookMySalon</span>
            </div>
            <p className="text-slate-400 text-sm leading-6">
              Book appointments, manage salons, and track bookings in one place.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="/salons" className="hover:text-white">Find Salons</a></li>
              <li><a href="/bookings" className="hover:text-white">My Bookings</a></li>
              <li><a href="/profile" className="hover:text-white">Profile</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li className="flex items-center gap-2"><Mail size={16} className="text-slate-300" /> Founder: {SITE_PROFILE.founderName}</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-slate-300" /> {SITE_PROFILE.phone}</li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-300 mt-0.5" />
                <a href={SITE_PROFILE.locationUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                  {SITE_PROFILE.locationLabel}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap border-t border-slate-800 pt-6">
          <p className="text-slate-400 text-sm">&copy; {currentYear} BookMySalon. All rights reserved.</p>
          <div className="flex gap-3">
            <a
              href={SITE_PROFILE.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href={SITE_PROFILE.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center"
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
