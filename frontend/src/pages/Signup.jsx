import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, AlertCircle, Sparkles, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup, error: authError } = useAuth();
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Client-side validation
    if (!formData.name || formData.name.trim().length < 3) {
      setLocalError('Name must be at least 3 characters');
      return;
    }
    if (formData.name && formData.name.length > 50) {
      setLocalError('Name must not exceed 50 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      setLocalError('Email is required');
      return;
    } else if (!emailRegex.test(formData.email)) {
      setLocalError('Please enter a valid email');
      return;
    }

    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      setLocalError('Phone must be 10 digits');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await signup(formData.name, formData.email, formData.phone, formData.password, formData.role);
      navigate('/login');
    } catch (err) {
      setLocalError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return null;
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    if (strength <= 1) return { level: 'Weak', color: 'from-red-500 to-red-600', width: '25%' };
    if (strength <= 2) return { level: 'Fair', color: 'from-yellow-500 to-yellow-600', width: '50%' };
    if (strength <= 3) return { level: 'Good', color: 'from-blue-500 to-blue-600', width: '75%' };
    return { level: 'Strong', color: 'from-emerald-500 to-emerald-600', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();
  const error = localError || authError;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-10 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"
      />

      {/* Main Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <motion.div variants={itemVariants} className="glass-effect rounded-2xl p-8 backdrop-blur-xl border border-white/10">
          {/* Animated Logo */}
          <motion.div
            custom={0}
            variants={itemVariants}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl glow-effect"
          >
            <Sparkles className="text-white" size={36} />
          </motion.div>

          {/* Header */}
          <motion.div custom={1} variants={itemVariants} className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Create Account
              </span>
            </h1>
            <p className="text-slate-300 text-lg">Join our premium salon network</p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-3 backdrop-blur-sm"
            >
              <AlertCircle size={18} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <motion.div custom={2} variants={itemVariants}>
              <label className="block text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs">1</span>
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['CUSTOMER', 'SALON_OWNER'].map((role, idx) => (
                  <motion.label
                    key={role}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      formData.role === role
                        ? 'border-violet-500 bg-gradient-to-br from-violet-500/20 to-pink-500/20 shadow-lg shadow-violet-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div className="text-center">
                      <p className="font-semibold text-white text-sm">
                        {role === 'CUSTOMER' ? '👤 Customer' : '💇 Salon Owner'}
                      </p>
                    </div>
                  </motion.label>
                ))}
              </div>
            </motion.div>

            {/* Name Field */}
            <motion.div custom={3} variants={itemVariants}>
              <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs">2</span>
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                />
              </div>
            </motion.div>

            {/* Phone Field */}
            <motion.div custom={4} variants={itemVariants}>
              <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs">3</span>
                Phone Number
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition" size={20} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                />
              </div>
            </motion.div>

            {/* Email Input */}
            <motion.div custom={5} variants={itemVariants}>
              <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs">4</span>
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div custom={6} variants={itemVariants}>
              <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs">5</span>
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-12 py-3 text-white placeholder-slate-400 focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordStrength && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-300">Strength:</span>
                    <span className={`text-xs font-semibold bg-gradient-to-r ${passwordStrength.color} bg-clip-text text-transparent`}>
                      {passwordStrength.level}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: passwordStrength.width }}
                      transition={{ duration: 0.3 }}
                      className={`h-full bg-gradient-to-r ${passwordStrength.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm Password Input */}
            <motion.div custom={7} variants={itemVariants}>
              <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs">6</span>
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-12 py-3 text-white placeholder-slate-400 focus:bg-white/15 focus:border-violet-500/50 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 transition"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center gap-2">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle size={16} className="text-emerald-400" />
                      <span className="text-xs text-emerald-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-red-400" />
                      <span className="text-xs text-red-400">Passwords don't match</span>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Terms */}
            <motion.label custom={8} variants={itemVariants} className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" required className="mt-1 w-5 h-5 accent-violet-500" />
              <span className="text-xs text-slate-300 group-hover:text-slate-200 transition">
                I agree to the{' '}
                <a href="#" className="text-violet-400 hover:text-violet-300 font-semibold">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-violet-400 hover:text-violet-300 font-semibold">
                  Privacy Policy
                </a>
              </span>
            </motion.label>

            {/* Submit Button */}
            <motion.button
              custom={9}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <Sparkles size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div custom={10} variants={itemVariants} className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>

          {/* Login Link */}
          <motion.p custom={11} variants={itemVariants} className="text-center text-slate-300">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent hover:from-violet-300 hover:to-pink-300 transition">
              Sign in here
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
