/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-13
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_PROFILE } from '../config/site';
import { Wordmark } from './ui';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Discover salons', to: '/salons' },
      { label: 'Your appointments', to: '/bookings' },
      { label: 'Messages', to: '/chat' },
    ],
  },
  {
    title: 'For salons',
    links: [
      { label: 'List your salon', to: '/signup' },
      { label: 'Owner workspace', to: '/salon/dashboard' },
      { label: 'Sign in', to: '/login' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Wordmark />
          <p className="mt-5 text-sm leading-relaxed text-ink-2">
            Salon discovery, booking and day-to-day operations — in one calm place for clients and the people who
            look after them.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <p className="eyebrow mb-4">{column.title}</p>
            <ul className="space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-ink-2 transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="eyebrow mb-4">Contact</p>
          <ul className="space-y-2.5 text-sm text-ink-2">
            <li>{SITE_PROFILE.founderName}</li>
            <li>
              <a href={`tel:${SITE_PROFILE.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-ink">
                {SITE_PROFILE.phone}
              </a>
            </li>
            <li>{SITE_PROFILE.locationLabel}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-3 py-6 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} BookMySalon. All rights reserved.</p>
          <div className="flex gap-5">
            <a href={SITE_PROFILE.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-ink">
              LinkedIn
            </a>
            <a href={SITE_PROFILE.githubUrl} target="_blank" rel="noreferrer" className="hover:text-ink">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
