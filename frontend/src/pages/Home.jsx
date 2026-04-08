import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/brand-logo.png';
import { getDashboardPathByRole } from '../utils/roleRouting';

const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const revealItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.62,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const overviewItems = [
  { title: 'Customer Delight', subtitle: 'Discover top salons and book in under a minute' },
  { title: 'Owner Control', subtitle: 'Run services, slots, and bookings without chaos' },
  { title: 'Admin Intelligence', subtitle: 'Track growth, activity, and booking health instantly' },
  { title: 'Live Coordination', subtitle: 'Status, alerts, and actions synced in real time' },
];

const capabilities = [
  {
    icon: CalendarCheck2,
    title: 'Lightning-fast booking',
    description: 'Search, select services, and lock a slot in a guided flow customers trust.',
  },
  {
    icon: Store,
    title: 'Revenue-ready owner hub',
    description: 'Control salon profile, pricing, catalog, and booking pipeline from one place.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust-first security',
    description: 'Role-based access, protected authentication, and reliable booking state transitions.',
  },
  {
    icon: LayoutDashboard,
    title: 'Purpose-built dashboards',
    description: 'Focused customer, owner, and admin workspaces with zero operational clutter.',
  },
  {
    icon: WalletCards,
    title: 'Transparent checkout',
    description: 'Clear pricing, expected duration, and instant confirmations that reduce drop-offs.',
  },
  {
    icon: ListChecks,
    title: 'Decision-ready details',
    description: 'Ratings, service specs, and hours are visible before customers commit.',
  },
];

const steps = [
  {
    label: 'Discover',
    description: 'Find nearby salons by city, distance, and service fit.',
    icon: MapPin,
  },
  {
    label: 'Choose',
    description: 'Compare pricing, duration, ratings, and available slots.',
    icon: ListChecks,
  },
  {
    label: 'Book',
    description: 'Confirm instantly and receive live updates until appointment time.',
    icon: CalendarCheck2,
  },
  {
    label: 'Manage',
    description: 'Track bookings, conversations, and performance in one timeline.',
    icon: Clock3,
  },
];

const testimonials = [
  {
    name: 'Customers',
    role: 'Book confidently',
    quote:
      'I can compare options and book confidently without calling multiple salons.',
  },
  {
    name: 'Salon Owners',
    role: 'Operate smarter',
    quote:
      'From categories to confirmations, daily operations now run from one console.',
  },
  {
    name: 'Admins',
    role: 'Scale with visibility',
    quote:
      'I get real-time visibility into bookings, revenue signals, and platform activity.',
  },
];

export default function Home() {
  const { user } = useAuth();

  const primaryPath = user ? getDashboardPathByRole(user.role) : '/signup';
  const secondaryPath = user ? '/salons' : '/login';

  return (
    <div className="relative overflow-hidden page-transition">
      <motion.div
        className="pointer-events-none absolute -top-28 -left-24 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl"
        animate={{ y: [0, 28, 0], x: [0, 18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute top-[18rem] -right-20 h-[26rem] w-[26rem] rounded-full bg-accent-500/20 blur-3xl"
        animate={{ y: [0, -22, 0], x: [0, -16, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <section className="relative px-4 pb-20 pt-20 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]"
          variants={revealContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={revealItem}>
            <span className="badge-secondary inline-flex items-center gap-2">
              <Sparkles size={15} />
              Built for modern salons
            </span>

            <h1 className="mt-7 text-5xl font-bold leading-[1.02] text-slate-900 sm:text-6xl">
              Book appointments faster,
              <br />
              run operations smarter,
              <span className="gradient-text"> without the chaos.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              From discovery to checkout to operations, BookMySalon connects customers, salon teams, and admins in one
              high-performance platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="status-pill status-success">Instant slot discovery</span>
              <span className="status-pill status-pending">Live booking timeline</span>
              <span className="status-pill status-success">Role-based command center</span>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to={primaryPath} className="btn-primary inline-flex items-center gap-2">
                {user ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight size={18} />
              </Link>
              <Link to={secondaryPath} className="btn-secondary inline-flex items-center gap-2">
                {user ? 'Find Salons' : 'Sign In'}
              </Link>
            </div>

          </motion.div>

          <motion.div variants={revealItem} className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="card-base relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/12" />
              <div className="relative">
                <div className="flex items-center justify-between rounded-2xl surface-muted p-4">
                  <div className="flex items-center gap-3">
                    <img src={brandLogo} alt="BookMySalon" className="h-11 w-11 rounded-xl object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">BookMySalon</p>
                      <p className="text-xs text-slate-600">Unified growth command center</p>
                    </div>
                  </div>
                  <span className="status-pill status-success">Live</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="surface-muted rounded-2xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer Journey</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">Service selected and slot locked</p>
                    <p className="mt-1 text-sm text-slate-600">Track every step from My Bookings</p>
                  </div>
                  <div className="surface-muted rounded-2xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operations Snapshot</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">Pending, Confirmed, Completed</p>
                    <p className="mt-1 text-sm text-slate-600">Move every booking stage in one click</p>
                  </div>
                </div>

                <div className="mt-4 surface-muted rounded-2xl p-4">
                  <p className="text-sm font-semibold text-slate-900">What teams gain with BookMySalon</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-emerald-600" />
                      Higher booking completion with fewer friction points.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-emerald-600" />
                      Clear ownership across customer, owner, and admin workflows.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 text-emerald-600" />
                      Consistent UX across search, booking, chat, and dashboards.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>

        <motion.div variants={revealItem} className="mx-auto mt-10 grid w-full max-w-7xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overviewItems.map((item) => (
            <div key={item.title} className="card-base rounded-2xl p-4">
              <p className="text-xl font-bold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto w-full max-w-7xl"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={revealItem} className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl">One platform. Every critical workflow.</h2>
            <p className="mt-4 text-lg text-slate-600">
              Designed to shorten booking time and improve operational reliability at scale.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.article key={feature.title} variants={revealItem} className="card-base rounded-2xl p-6">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                    <Icon size={21} />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-slate-600">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto w-full max-w-7xl"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.22 }}
        >
          <motion.div variants={revealItem} className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl">How BookMySalon works</h2>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Customers book in minutes while salon teams keep full control of operations.
              </p>
            </div>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.label} variants={revealItem} className="card-base rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
                      {index + 1}
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600">
                      <Icon size={18} />
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{step.label}</h3>
                  <p className="mt-2 text-slate-600">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto w-full max-w-7xl"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.22 }}
        >
          <motion.div variants={revealItem} className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl">Loved by customers. Trusted by operators.</h2>
            <p className="mt-3 text-lg text-slate-600">
              Every role gets focused tools to move faster and make better decisions.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <motion.article key={item.name} variants={revealItem} className="card-base rounded-2xl p-6">
                <div className="mb-4 flex items-center gap-2 text-amber-500">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-slate-700">{`\u201C${item.quote}\u201D`}</p>
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-600">{item.role}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto w-full max-w-5xl card-base relative overflow-hidden rounded-3xl p-10 text-center sm:p-14"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-accent-500/12" />
          <motion.div variants={revealItem} className="relative">
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl">Ready to move your salon experience faster?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              Create your account to start booking or managing operations in one connected workflow.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to={primaryPath} className="btn-primary inline-flex items-center gap-2">
                {user ? 'Open Dashboard' : 'Create Account'}
                <ArrowRight size={18} />
              </Link>
              {!user && (
                <Link to={secondaryPath} className="btn-secondary inline-flex items-center gap-2">
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
