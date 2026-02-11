import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      validationErrors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      validationErrors.push('Please enter a valid email address');
    }

    if (!password) {
      validationErrors.push('Password is required');
    }

    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }

    setIsLoading(true);
    const success = await login(email.trim(), password);
    if (success) {
      navigate('/');
    }
    setIsLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-10 right-10 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        <div className="card-base p-8 border border-white/20">
          {/* Animated Logo */}
          <motion.div
            className="text-center mb-8"
            custom={0}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl glow-effect"
            >
              <Sparkles className="text-white" size={32} />
            </motion.div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your BookMySalon account</p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm backdrop-blur"
            >
              ✕ {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <motion.div custom={1} variants={itemVariants} initial="hidden" animate="visible">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-4 text-violet-400 group-focus-within:text-pink-400 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-field pl-12 group-focus-within:border-violet-400 group-focus-within:shadow-lg group-focus-within:shadow-violet-500/20"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div custom={2} variants={itemVariants} initial="hidden" animate="visible">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-violet-400 group-focus-within:text-pink-400 transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field pl-12 pr-12 group-focus-within:border-violet-400 group-focus-within:shadow-lg group-focus-within:shadow-violet-500/20"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-violet-400 hover:text-pink-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </motion.button>
              </div>
            </motion.div>

            {/* Remember Me & Forgot */}
            <motion.div custom={3} variants={itemVariants} initial="hidden" animate="visible" className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="rounded bg-white/10 border-white/20 text-violet-500 cursor-pointer" />
                <span className="text-gray-300 group-hover:text-white transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-violet-400 hover:text-pink-400 font-medium transition-colors">
                Forgot password?
              </a>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              custom={4}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              {isLoading ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Signing in...
                </motion.span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <motion.div custom={5} variants={itemVariants} initial="hidden" animate="visible" className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>

          {/* Signup Link */}
          <motion.div custom={6} variants={itemVariants} initial="hidden" animate="visible" className="text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <Link to="/signup" className="text-violet-400 hover:text-pink-400 font-semibold transition-colors">
                Sign up now
              </Link>
            </p>
          </motion.div>

          {/* Test Credentials Helper */}
          <motion.div custom={7} variants={itemVariants} initial="hidden" animate="visible" className="mt-6 p-3 bg-violet-600/10 border border-violet-500/30 rounded-lg text-xs text-gray-300 backdrop-blur">
            <p className="font-semibold text-violet-300 mb-1">📧 Test Login:</p>
            <p>Email: <span className="text-white font-mono">test@test.com</span></p>
            <p>Password: <span className="text-white font-mono">Test123</span></p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-secondary-600">New to BookMySalon?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-secondary-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 font-semibold hover:text-primary-700">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
        >
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <p>Customer: demo@customer.com / password123</p>
          <p>Owner: demo@owner.com / password123</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
