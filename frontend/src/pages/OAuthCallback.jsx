import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const hasCode = useMemo(() => Boolean(searchParams.get('code')), [searchParams]);
  const hasLegacyToken = useMemo(() => Boolean(searchParams.get('token')), [searchParams]);

  useEffect(() => {
    const completeOAuthLogin = async () => {
      const oauthError = searchParams.get('error');
      if (oauthError) {
        setError(oauthError);
        return;
      }

      const code = searchParams.get('code');
      if (code) {
        try {
          const response = await api.post('/api/auth/oauth/exchange', { code });
          const { token, refreshToken, id } = response || {};

          if (!token) {
            setError('Google login did not return an access token.');
            return;
          }

          localStorage.setItem('accessToken', token);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          if (id) localStorage.setItem('userId', id);

          navigate('/', { replace: true });
          return;
        } catch (err) {
          setError(err?.response?.data?.error || err?.response?.data?.message || 'Google login failed. Please try again.');
          return;
        }
      }

      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const userId = searchParams.get('id');

      if (!token) {
        setError('Google login did not return an access token.');
        return;
      }

      localStorage.setItem('accessToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (userId) localStorage.setItem('userId', userId);

      navigate('/', { replace: true });
    };

    completeOAuthLogin();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card-base max-w-md w-full rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Google Sign-In Failed</h1>
          <p className="text-slate-600 mt-3">{error}</p>
          <Link to="/login" className="btn-primary inline-block mt-6">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-base max-w-md w-full rounded-2xl p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Signing You In</h1>
        <p className="text-slate-600 mt-3">
          {hasCode || hasLegacyToken ? 'Completing Google authentication...' : 'Waiting for Google response...'}
        </p>
      </div>
    </div>
  );
}
