import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Calendar,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Expert Stylists',
      description: 'Connect with professional and verified stylists',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Star,
      title: 'Verified Reviews',
      description: 'Read honest reviews from real customers',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing',
      gradient: 'from-emerald-500 to-teal-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Customer',
      image: '👩‍🦰',
      text: 'BookMySalon made finding and booking my favorite salon incredible. The interface is stunning!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Salon Owner',
      image: '👨‍💼',
      text: 'This platform completely transformed how I manage bookings. Highly recommended for all salon owners!',
      rating: 5,
    },
    {
      name: 'Emma Davis',
      role: 'Customer',
      image: '👩‍🦱',
      text: 'The booking process is seamless and the design is absolutely beautiful. Best salon app I\'ve used!',
      rating: 5,
    },
  ];

  const steps = [
    { step: '1', title: 'Search', description: 'Find salons near you', icon: '🔍' },
    { step: '2', title: 'Browse', description: 'Check services & reviews', icon: '📋' },
    { step: '3', title: 'Book', description: 'Select date and time', icon: '📅' },
    { step: '4', title: 'Enjoy', description: 'Get professional services', icon: '✨' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="fixed top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="fixed bottom-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl -z-10"
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
                className="inline-block px-5 py-2 bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-violet-300 rounded-full text-sm font-semibold mb-6 border border-violet-500/30"
                whileHover={{ scale: 1.05 }}
              >
                ✨ Premium Salon Booking Platform
              </motion.span>

              <h1 className="text-6xl sm:text-7xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Find & Book Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Perfect Salon
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-xl">
                Discover, connect, and book appointments with the best salons in your area. Verified reviews, expert stylists, and instant confirmation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to={user ? (user.role === 'CUSTOMER' ? '/salons' : '/salon/dashboard') : '/signup'} 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-violet-500/50 transition-all"
                  >
                    {user ? (user.role === 'CUSTOMER' ? 'Find Salons' : 'Go to Dashboard') : 'Get Started'}
                    <ArrowRight size={20} />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <a 
                    href="#features" 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 hover:border-white/30 transition-all backdrop-blur-sm"
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
                    className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm"
                  >
                    <p className="text-3xl mb-1">{stat.icon}</p>
                    <p className="text-2xl font-bold text-violet-400">{stat.value}</p>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
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
                <div className="w-96 h-96 bg-gradient-to-br from-violet-600/30 via-purple-600/30 to-pink-600/30 rounded-3xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-sm flex items-center justify-center text-9xl glow-effect">
                  💇‍♀️
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-8 -right-8 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-5xl shadow-lg glow-effect"
                >
                  ⭐
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -bottom-8 left-8 w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-3xl shadow-lg glow-effect"
                >
                  💕
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
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Why Choose BookMySalon?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
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
                  className="group p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-2xl transition-all`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 group-hover:text-slate-200 transition">
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
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-[2rem] w-[calc(100%+2rem)] h-1 bg-gradient-to-r from-violet-500 to-transparent" />
                )}

                <div className="text-center">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                    className="w-20 h-20 bg-gradient-to-br from-violet-600 to-pink-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-xl shadow-violet-500/30 group-hover:shadow-2xl transition-all"
                  >
                    {item.step}
                  </motion.div>
                  <p className="text-4xl mb-4">{item.icon}</p>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-300">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
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
            <h2 className="text-5xl font-bold mb-6 text-white">
              Loved by Customers & Salon Owners
            </h2>
            <p className="text-xl text-slate-300">
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
                className="p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl">{testimonial.image}</span>
                  <div>
                    <h3 className="font-bold text-white text-lg">{testimonial.name}</h3>
                    <p className="text-slate-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.span 
                      key={i} 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-2xl"
                    >
                      ⭐
                    </motion.span>
                  ))}
                </div>
                <p className="text-slate-300 italic">"{testimonial.text}"</p>
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
            className="relative overflow-hidden rounded-3xl p-16 text-center border border-white/10"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/50 via-purple-600/50 to-pink-600/50 blur-xl -z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 -z-10" />

            <motion.h2 variants={itemVariants} className="text-5xl font-bold mb-6 text-white">
              Ready to book your next appointment?
            </motion.h2>
            <motion.p variants={itemVariants} className="text-xl mb-10 text-slate-100 max-w-2xl mx-auto">
              Join thousands of satisfied customers using BookMySalon for their beauty needs
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={user ? (user.role === 'CUSTOMER' ? '/salons' : '/salon/dashboard') : '/signup'}
                  className="inline-flex items-center gap-2 bg-white text-violet-600 font-bold py-4 px-10 rounded-xl hover:bg-slate-50 transition-all shadow-xl"
                >
                  Get Started Today
                  <ArrowRight size={20} />
                </Link>
              </motion.div>
              {!user && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-10 rounded-xl transition-all backdrop-blur-sm border border-white/20"
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
