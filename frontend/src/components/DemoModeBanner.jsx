import React, { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { useT } from '../i18n';
import { apiModeReady, isMockMode, retryRealBackend } from '../mock/mode';
import { clearAuthSession } from '../utils/authSession';

const FORCED = String(import.meta.env.VITE_API_MODE || 'auto').toLowerCase() === 'mock';

/**
 * Always-visible notice while the app runs on sample data. Simulated bookings and
 * messages must never be mistaken for real ones, so this bar is not dismissible.
 */
export default function DemoModeBanner() {
  const t = useT();
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    apiModeReady.then(() => setDemo(isMockMode()));
  }, []);

  if (!demo) return null;

  const reset = async () => {
    const { resetDemoData } = await import('../mock/db');
    resetDemoData();
    clearAuthSession();
    window.location.assign('/');
  };

  return (
    <div role="status" className="border-b border-warning/25 bg-warning-soft text-[13px] text-warning">
      <div className="shell flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <FlaskConical size={15} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1">
          <span className="font-semibold">{t('demo.title')}</span>{' '}
          <span className="sm:hidden">{t('demo.short')}</span>
          <span className="hidden sm:inline">{FORCED ? t('demo.bodyForced') : t('demo.bodyAuto')}</span>
        </p>
        <div className="flex gap-3 font-semibold">
          {!FORCED && (
            <button type="button" className="underline-offset-4 hover:underline" onClick={retryRealBackend}>
              {t('demo.retry')}
            </button>
          )}
          <button type="button" className="underline-offset-4 hover:underline" onClick={reset}>
            {t('demo.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
