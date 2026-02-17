/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, Phone, Sparkles, ShieldCheck } from 'lucide-react';
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

  const [otpData, setOtpData] = useState({
    sessionToken: '',
    emailOtp: '',
    phoneOtp: '',
    expiresAtEpochMs: 0,
    maskedEmail: '',
    maskedPhone: '',
    devEmailOtp: '',
    devPhoneOtp: '',
  });

  const [stage, setStage] = useState('FORM');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { initiateSignupOtp, resendSignupOtp, verifySignupOtp, error: authError } = useAuth();
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const error = localError || authError;

  const otpMinutesRemaining = useMemo(() => {
    if (!otpData.expiresAtEpochMs) return 0;
    const msLeft = otpData.expiresAtEpochMs - Date.now();
    return Math.max(0, Math.ceil(msLeft / 60000));
  }, [otpData.expiresAtEpochMs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const handleInitiateSignup = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const response = await initiateSignupOtp(formData);
    setIsLoading(false);

    if (!response) return;

    setOtpData({
      sessionToken: response.sessionToken || '',
      emailOtp: '',
      phoneOtp: '',
      expiresAtEpochMs: response.expiresAtEpochMs || 0,
      maskedEmail: response.maskedEmail || formData.email,
      maskedPhone: response.maskedPhone || formData.phone,
      devEmailOtp: response.devEmailOtp || '',
      devPhoneOtp: response.devPhoneOtp || '',
    });
    setStage('OTP');
    setSuccess('OTP sent to your email and phone. Please verify to complete signup.');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!otpData.emailOtp || !otpData.phoneOtp) {
      setLocalError('Both OTPs are required.');
      return;
    }

    setIsLoading(true);
    const ok = await verifySignupOtp(otpData.sessionToken, otpData.emailOtp.trim(), otpData.phoneOtp.trim());
    setIsLoading(false);

    if (ok) {
      navigate('/');
    }
  };

  const handleResendOtp = async () => {
    setLocalError('');
    setSuccess('');
    setIsLoading(true);
    const response = await resendSignupOtp(otpData.sessionToken);
    setIsLoading(false);

    if (!response) return;

    setOtpData((prev) => ({
      ...prev,
      emailOtp: '',
      phoneOtp: '',
      expiresAtEpochMs: response.expiresAtEpochMs || prev.expiresAtEpochMs,
      devEmailOtp: response.devEmailOtp || '',
      devPhoneOtp: response.devPhoneOtp || '',
    }));
    setSuccess('OTP resent successfully.');
  };

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-2xl card-base p-8 sm:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Create Account</h1>
            <p className="text-slate-600 mt-2">
              {stage === 'FORM' ? 'Get started as customer or salon owner.' : 'Verify email + mobile OTP to activate account.'}
            </p>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center text-blue-700">
            {stage === 'FORM' ? <Sparkles size={20} /> : <ShieldCheck size={20} />}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-300 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{success}</div>}

        {stage === 'FORM' ? (
          <form onSubmit={handleInitiateSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {['CUSTOMER', 'SALON_OWNER'].map((role) => (
                <label
                  key={role}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm text-center font-semibold ${
                    formData.role === role
                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                      : 'border-slate-200 text-slate-600 bg-white'
                  }`}
                >
                  <input type="radio" name="role" value={role} checked={formData.role === role} onChange={handleChange} className="hidden" />
                  {role === 'CUSTOMER' ? 'Customer' : 'Salon Owner'}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <div className="relative mt-1.5">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input-field input-with-icon" name="name" value={formData.name} onChange={handleChange} required />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Phone</label>
                <div className="relative mt-1.5">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input-field input-with-icon" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <div className="relative mt-1.5">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input-field input-with-icon" type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative mt-1.5">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input-field input-with-icon pr-11" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                <div className="relative mt-1.5">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input-field input-with-icon pr-11" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Sending OTP...' : 'Continue with OTP Verification'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
              <p>OTP sent to: <strong>{otpData.maskedEmail}</strong> and <strong>{otpData.maskedPhone}</strong></p>
              <p className="mt-1">Expires in approximately {otpMinutesRemaining} minute(s).</p>
              {(otpData.devEmailOtp || otpData.devPhoneOtp) && (
                <p className="mt-2 text-xs text-blue-700">Dev OTPs: Email {otpData.devEmailOtp}, Phone {otpData.devPhoneOtp}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Email OTP</label>
              <input className="input-field mt-1.5" value={otpData.emailOtp} onChange={(e) => setOtpData((prev) => ({ ...prev, emailOtp: e.target.value }))} required />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Phone OTP</label>
              <input className="input-field mt-1.5" value={otpData.phoneOtp} onChange={(e) => setOtpData((prev) => ({ ...prev, phoneOtp: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="btn-primary w-full" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify & Create Account'}</button>
              <button type="button" className="btn-outline w-full" onClick={handleResendOtp} disabled={isLoading}>Resend OTP</button>
            </div>

            <button type="button" className="text-sm text-slate-600 hover:text-slate-800" onClick={() => setStage('FORM')}>Back to form</button>
          </form>
        )}

        <p className="text-slate-600 text-sm mt-6 text-center">
          Already have an account? <Link to="/login" className="text-blue-700 hover:text-blue-800 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
