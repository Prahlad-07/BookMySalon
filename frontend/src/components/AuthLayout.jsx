import React from 'react';
import authImage from '../assets/auth-chair.jpg';

/**
 * Split-screen frame for every account screen: form on the left,
 * photography + one quiet line of brand copy on the right.
 */
export default function AuthLayout({ eyebrow, title, description, children, footer, aside }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center animate-fade">
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h1 className="display text-[44px] text-ink sm:text-[52px]">{title}</h1>
          {description && <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{description}</p>}
          <div className="mt-9">{children}</div>
          {footer && <div className="mt-8 text-sm text-ink-2">{footer}</div>}
        </div>
      </div>

      <aside className="relative hidden overflow-hidden lg:block">
        <img src={authImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white xl:p-16">
          {aside || (
            <>
              <p className="font-display text-[40px] leading-[1.05] xl:text-[48px]">
                Fewer phone calls.
                <br />
                <span className="italic">More good appointments.</span>
              </p>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/75">
                Book, reschedule and talk to your salon from one place — and keep every detail of your appointment
                where you can find it.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
