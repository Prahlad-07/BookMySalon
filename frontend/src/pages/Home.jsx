import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Users,
  Star,
  ArrowRight,
  Shield,
  Search,
  ListChecks,
  CalendarCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import brandLogo from '../assets/brand-logo.png';
import { getDashboardPathByRole } from '../utils/roleRouting';

export default function Home() {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
    },
  };

  const features = [
    {
      icon: Calendar,
      title: 'Smart Booking',
      description: 'Book your salon appointments in just a few clicks',
      gradient: 'from-primary-500 to-secondary-500',
    },
    {
      icon: Users,
      title: 'Expert Stylists',
      description: 'Connect with professional and verified stylists',
      gradient: 'from-secondary-500 to-accent-500',
    },
    {
      icon: Star,
      title: 'Verified Reviews',
      description: 'Read honest reviews from real customers',
      gradient: 'from-primary-600 to-accent-500',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing',
      gradient: 'from-accent-500 to-secondary-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Customer',
      initials: 'SJ',
      text: 'BookMySalon made finding and booking my favorite salon incredible. The interface is stunning!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Salon Owner',
      initials: 'MC',
      text: 'This platform completely transformed how I manage bookings. Highly recommended for all salon owners!',
      rating: 5,
    },
    {
      name: 'Emma Davis',
      role: 'Customer',
      initials: 'ED',
      text: 'The booking process is seamless and the design is absolutely beautiful. Best salon app I\'ve used!',
      rating: 5,
    },
  ];

  const steps = [
    { step: '1', title: 'Search', description: 'Find top salons in your city', icon: Search },
    { step: '2', title: 'Compare', description: 'Review services and trusted ratings', icon: ListChecks },
    { step: '3', title: 'Book', description: 'Pick slot and confirm in seconds', icon: CalendarCheck2 },
    { step: '4', title: 'Enjoy', description: 'Experience premium salon care', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden page-transition">
      {/* Animated Background Elements */}
      <motion.div
        animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="fixed top-0 left-0 w-96 h-96 bg-primary-400/25 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="fixed bottom-0 right-0 w-96 h-96 bg-accent-400/25 rounded-full blur-3xl -z-10"
      />

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side */}
            <motion.div variants={itemVariants}>
              <motion.span 
                className="inline-block px-5 py-2 surface-muted text-primary-700 rounded-full text-sm font-semibold mb-6"
                whileHover={{ scale: 1.05 }}
              >
                ✨ Premium Salon Booking Platform
              </motion.span>

              <h1 className="text-5xl sm:text-6xl font-bold mb-8 leading-tight text-slate-900">
                <span className="gradient-text">
                  Find & Book Your
                </span>
                <br />
                <span className="gradient-text">
                  Perfect Salon
                </span>
              </h1>

              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                Discover, connect, and book appointments with the best salons in your area. Verified reviews, expert stylists, and instant confirmation.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <span className="badge-secondary">Real-time confirmation</span>
                <span className="badge-secondary">Verified professionals</span>
                <span className="badge-secondary">Secure checkout</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to={user ? getDashboardPathByRole(user.role) : '/signup'}
                    className="btn-primary inline-flex items-center gap-2 px-8 py-4"
                  >
                    {user ? 'Go to Dashboard' : 'Get Started'}
                    <ArrowRight size={20} />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <a 
                    href="#features" 
                    className="btn-secondary inline-flex items-center gap-2 px-8 py-4"
                  >
                    Learn More
                    <Sparkles size={20} />
                  </a>
                </motion.div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Salons', value: '500+', icon: '🏢' },
                  { label: 'Bookings', value: '10k+', icon: '📅' },
                  { label: 'Customers', value: '50k+', icon: '👥' },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="card-base p-4"
                  >
                    <p className="text-3xl mb-1">{stat.icon}</p>
                    <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
                    <p className="text-slate-600 text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Hero Image */}
            <motion.div variants={itemVariants} className="relative hidden lg:flex items-center justify-center">
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="relative"
              >
                <div className="w-[28rem] h-[28rem] glass-effect rounded-[2rem] overflow-hidden flex items-center justify-center glow-effect p-8">
                  <div className="w-full h-full rounded-3xl bg-gradient-to-br from-sky-50 via-white to-teal-50 border border-slate-200/70 flex items-center justify-center">
                    <img src={brandLogo} alt="BookMySalon" className="w-64 h-64 object-contain rounded-2xl drop-shadow-xl" />
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-8 -right-8 w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg glow-effect"
                >
                  <Sparkles className="text-white" size={34} />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-8 left-8 w-20 h-20 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-full flex items-center justify-center shadow-lg glow-effect"
                >
                  <Shield className="text-white" size={28} />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6">
              <span className="gradient-text">
                Why Choose BookMySalon?
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We've made booking salon appointments as easy and beautiful as it gets
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  custom={index}
                  variants={itemVariants}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group card-base card-hover p-8 transition-all"
                >
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-2xl transition-all`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 transition">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-20">
            <h2 className="text-5xl font-bold">
              <span className="gradient-text">
                How It Works
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => {
              const StepIcon = item.icon;
              return (
                <motion.div
                  key={index}
                  custom={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-[2rem] w-[calc(100%+2rem)] h-1 bg-gradient-to-r from-primary-500 to-transparent" />
                  )}

                  <div className="text-center">
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                      className="w-20 h-20 bg-gradient-to-br from-primary-600 to-secondary-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-xl shadow-primary-500/30 group-hover:shadow-2xl transition-all"
                    >
                      {item.step}
                    </motion.div>
                    <div className="w-14 h-14 rounded-xl bg-primary-50 text-primary-700 border border-primary-100 inline-flex items-center justify-center mb-4">
                      <StepIcon size={26} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-slate-900">
              Loved by Customers & Salon Owners
            </h2>
            <p className="text-xl text-slate-600">
              See what people are saying about BookMySalon
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="card-base card-hover p-8 transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white text-sm font-bold inline-flex items-center justify-center shadow-lg">
                    {testimonial.initials}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{testimonial.name}</h3>
                    <p className="text-slate-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.span 
                      key={i} 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-amber-500"
                    >
                      <Star size={18} fill="currentColor" />
                    </motion.span>
                  ))}
                </div>
                <p className="text-slate-600 italic">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={itemVariants}
            className="card-base relative overflow-hidden rounded-3xl p-16 text-center"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/12 via-secondary-500/12 to-accent-500/12 -z-10" />

            <motion.h2 variants={itemVariants} className="text-5xl font-bold mb-6 text-slate-900">
              Ready to book your next appointment?
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl mb-10 text-slate-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers using BookMySalon for their beauty needs
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={user ? getDashboardPathByRole(user.role) : '/signup'}
                  className="btn-primary inline-flex items-center gap-2 py-4 px-10"
                >
                  Get Started Today
                  <ArrowRight size={20} />
                </Link>
              </motion.div>
              {!user && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="btn-secondary inline-flex items-center gap-2 py-4 px-10"
                  >
                    Sign In
                    <ArrowRight size={20} />
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
