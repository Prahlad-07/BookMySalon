import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../utils/roleRouting';
import { useT } from '../i18n';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { acceptExternalSession } = useAuth();
  const [error, setError] = useState('');
  const t = useT();

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
          const authenticatedUser = await acceptExternalSession(response);
          navigate(getDashboardPathByRole(authenticatedUser.role), { replace: true });
          return;
        } catch (err) {
          setError(err?.response?.data?.error || err?.response?.data?.message || t('oauth.failed'));
          return;
        }
      }

      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const userId = searchParams.get('id');

      if (!token) {
        setError(t('oauth.noToken'));
        return;
      }

      try {
        const authenticatedUser = await acceptExternalSession({
          token,
          refreshToken,
          id: userId,
        });
        navigate(getDashboardPathByRole(authenticatedUser.role), { replace: true });
      } catch (err) {
        setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || t('oauth.failed'));
      }
    };

    completeOAuthLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptExternalSession, navigate, searchParams]);

  if (error) {
    return (
      <div className="shell flex min-h-[70vh] flex-col justify-center py-20">
        <div className="max-w-md">
          <p className="eyebrow">{t('oauth.eyebrow')}</p>
          <h1 className="display mt-3 text-[30px] text-ink">{t('oauth.title')}</h1>
          <p className="mt-3 text-ink-2">{error}</p>
          <Link to="/login" className="btn-dark mt-8">
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center" role="status">
      <span className="spinner" aria-hidden="true" />
      <p className="text-sm text-ink-2">
        {hasCode || hasLegacyToken ? t('oauth.finishing') : t('oauth.waiting')}
      </p>
    </div>
  );
}
