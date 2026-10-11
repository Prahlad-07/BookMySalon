/**
 * @author Prahlad Yadav
 * @version 3.0
 * @since 2026-02-16
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../utils/roleRouting';
import heroImage from '../assets/hero-salon.jpg';
import craftImage from '../assets/detail-tools.jpg';
import studioImage from '../assets/owner-studio.jpg';

const steps = [
  {
    n: '01',
    title: 'Find your place',
    body: 'Browse salons near you with real menus, honest prices, opening hours and reviews from people who sat in the chair.',
  },
  {
    n: '02',
    title: 'Pick a time that works',
    body: 'Choose your services and a slot. We check the salon’s calendar as you book, so you never land on a double booking.',
  },
  {
    n: '03',
    title: 'Show up, or shift it',
    body: 'Your appointment lives in one place. Reschedule, cancel or message the salon without a single phone call.',
  },
];

const ownerPoints = [
  ['A menu clients can read', 'Publish services by category with prices and durations that stay in sync everywhere.'],
  ['A calendar that protects you', 'Overlapping requests are blocked at the source, and hours are enforced automatically.'],
  ['Conversations in context', 'Message clients from the booking itself — no more scrolling through personal chats.'],
  ['Numbers that mean something', 'See upcoming demand, completed revenue and your most-booked services at a glance.'],
];

function AppointmentTicket() {
  return (
    <div className="w-[300px] rounded-lg border border-line bg-surface p-5 shadow-pop">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Appointment</p>
        <span className="tag-success">
          <span className="dot" /> Confirmed
        </span>
      </div>
      <p className="display mt-4 text-[40px] leading-none text-ink">
        Fri, <span className="italic">3:30</span>
      </p>
      <p className="mt-1 text-sm text-ink-2">Studio North · Connaught Place</p>
      <div className="mt-5 space-y-2 border-t border-dashed border-line-strong pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-2">Signature haircut</span>
          <span className="num">$45.00</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-2">Beard trim &amp; shape</span>
          <span className="num">$20.00</span>
        </div>
      </div>
      <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm font-semibold">
        <span>Total · 65 min</span>
        <span className="num">$65.00</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const workspacePath = user ? getDashboardPathByRole(user.role) : '/signup';

  return (
    <div>
      {/* Hero */}
      <section className="shell grid items-center gap-14 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:pb-28 lg:pt-20">
        <div className="animate-fade">
          <p className="eyebrow">Salon booking, reconsidered</p>
          <h1 className="display mt-6 text-[56px] text-ink sm:text-[76px] lg:text-[88px]">
            The appointment you’ve been <span className="italic text-accent">meaning</span> to make.
          </h1>
          <p className="lede mt-7 max-w-[30rem]">
            Discover salons worth returning to, see what everything costs, and book a real slot in under a minute —
            no calls, no waiting on a reply.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={user ? '/salons' : '/signup'} className="btn-primary btn-lg">
              Find a salon <ArrowRight size={17} />
            </Link>
            <Link to={user ? workspacePath : '/signup'} className="btn-secondary btn-lg">
              {user ? 'Open your workspace' : 'List your salon'}
            </Link>
          </div>

          <dl className="mt-14 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line">
            {[
              ['Live', 'availability'],
              ['Clear', 'pricing upfront'],
              ['Direct', 'line to the salon'],
            ].map(([a, b]) => (
              <div key={a} className="py-4 pl-4 first:pl-0">
                <dt className="font-display text-[22px] leading-none text-ink">{a}</dt>
                <dd className="mt-1.5 text-[13px] text-ink-3">{b}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-fade" style={{ animationDelay: '90ms' }}>
          <div className="overflow-hidden rounded-lg">
            <img
              src={heroImage}
              alt="A bright, modern salon floor with styling chairs and round mirrors"
              className="aspect-[4/5] w-full object-cover lg:aspect-[5/6]"
            />
          </div>
          <div className="absolute -bottom-10 -left-4 hidden sm:block lg:-left-14">
            <AppointmentTicket />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface">
        <div className="shell py-20 lg:py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="display max-w-xl text-[44px] text-ink sm:text-[52px]">
              Three steps between you and a <span className="italic">good hair day.</span>
            </h2>
            <p className="max-w-sm text-ink-2">
              Everything you need to decide is on the page before you book. Everything after is in one place.
            </p>
          </div>

          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
            {steps.map((step) => (
              <li key={step.n} className="md:px-8 md:first:pl-0 md:last:pr-0">
                <span className="num font-mono text-[13px] text-accent">{step.n}</span>
                <h3 className="mt-4 text-[20px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Craft band */}
      <section className="shell py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <img
            src={craftImage}
            alt="A barber shaping a client's fade with comb and clippers"
            className="aspect-[4/5] w-full rounded-lg object-cover"
            loading="lazy"
          />
          <div>
            <p className="eyebrow">Why we built it</p>
            <p className="display mt-6 text-[40px] text-ink sm:text-[54px]">
              “Great salons are built in the chair. The admin should never get in the way of the{' '}
              <span className="italic text-accent">craft.</span>”
            </p>
            <p className="mt-8 max-w-md leading-relaxed text-ink-2">
              BookMySalon takes the back-and-forth out of booking for clients, and gives salons a calm, single place
              to run their menu, calendar and conversations.
            </p>
            <Link to={user ? '/salons' : '/signup'} className="link mt-8 inline-flex items-center gap-1.5">
              Start exploring <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* For owners */}
      <section className="bg-ink text-paper">
        <div className="shell grid gap-14 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-label text-paper/50">For salon owners</p>
            <h2 className="display mt-6 text-[46px] sm:text-[58px]">
              Run the floor. <span className="italic text-[rgb(222_146_124)]">We’ll</span> run the book.
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-paper/70">
              A workspace that keeps your menu, calendar and clients in step — so the next free chair is always the
              one that gets booked.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to={user ? workspacePath : '/signup'}
                className="btn btn-lg bg-paper text-ink hover:bg-paper/90"
              >
                {user ? 'Go to workspace' : 'List your salon'} <ArrowRight size={17} />
              </Link>
            </div>
            <img
              src={studioImage}
              alt="A minimalist salon with black walls and round mirrors"
              className="mt-14 hidden aspect-[16/10] w-full rounded-lg object-cover opacity-90 lg:block"
              loading="lazy"
            />
          </div>

          <ul className="self-center border-t border-paper/15">
            {ownerPoints.map(([title, body], index) => (
              <li key={title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-paper/15 py-7">
                <span className="num pt-1 font-mono text-[13px] text-paper/40">0{index + 1}</span>
                <div>
                  <p className="text-[18px] font-semibold">{title}</p>
                  <p className="mt-2 leading-relaxed text-paper/65">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing */}
      <section className="shell py-24 text-center lg:py-32">
        <h2 className="display mx-auto max-w-3xl text-[48px] text-ink sm:text-[68px]">
          Your next appointment is a <span className="italic text-accent">minute</span> away.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to={user ? '/salons' : '/signup'} className="btn-primary btn-lg">
            {user ? 'Browse salons' : 'Create a free account'}
          </Link>
          {!user && (
            <Link to="/login" className="btn-ghost btn-lg">
              I already have an account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
