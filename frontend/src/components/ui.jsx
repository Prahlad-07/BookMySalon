/**
 * Small, shared presentational primitives. Keep these dumb: no data fetching.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useT } from '../i18n';

/**
 * BookMySalon mark: a geometric "B" on a rose-wine tile, with a small sparkle for
 * beauty. The sparkle is dropped below 24px (favicon sizes) where it turns to noise.
 */
export function Mark({ size = 30, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="64" height="64" rx="16" className="fill-accent" />
      <path
        d={size < 24 ? 'M23 15.5V48.5M23 15.5H30A7 7 0 0 1 30 29.5H23M23 29.5H31.5A9.5 9.5 0 0 1 31.5 48.5H23' : 'M22 15.5V48.5M22 15.5H29A7 7 0 0 1 29 29.5H22M22 29.5H30.5A9.5 9.5 0 0 1 30.5 48.5H22'}
        fill="none"
        strokeWidth="6.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-accent-ink"
      />
      {size >= 24 && (
        <path d="M49 9.5 L50.5 13.3 L54.3 14.8 L50.5 16.3 L49 20.1 L47.5 16.3 L43.7 14.8 L47.5 13.3 Z" className="fill-accent-ink" opacity="0.82" />
      )}
    </svg>
  );
}

export function Wordmark({ to = '/', className = '', size = 'md' }) {
  const t = useT();
  const lg = size === 'lg';
  return (
    <Link to={to} className={`group inline-flex items-center gap-2.5 ${className}`} aria-label={t('nav.home')}>
      <Mark size={lg ? 36 : 30} className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className={`${lg ? 'text-[22px]' : 'text-[19px]'} font-bold leading-none tracking-[-0.035em] text-ink`}>
        BookMy<span className="text-accent">Salon</span>
      </span>
    </Link>
  );
}

export function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <header className={`flex flex-col gap-5 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="display text-[28px] text-ink sm:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ index, title, description, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-baseline gap-3 text-[19px] font-semibold text-ink">
          {index && <span className="num font-mono text-xs font-normal text-ink-3">{index}</span>}
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stars({ value = 0, size = 13, className = '' }) {
  const t = useT();
  const rounded = Math.round(Number(value) || 0);
  return (
    <span
      className={`inline-flex items-center gap-[2px] ${className}`}
      aria-label={t('common.ratingOutOf5', { value: Number(value || 0).toFixed(1) })}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.75}
          className={i <= rounded ? 'fill-gold text-gold' : 'text-line-strong'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

const initialsOf = (name = '') =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

const AVATAR_TONES = [
  'bg-accent-soft text-accent',
  'bg-sage-soft text-sage',
  'bg-warning-soft text-warning',
  'bg-sunken text-ink-2',
];

export function Avatar({ name, size = 36, className = '' }) {
  const seed = String(name || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${AVATAR_TONES[seed % AVATAR_TONES.length]} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initialsOf(name)}
    </span>
  );
}

const STATUS_CLASS = {
  PENDING: 'tag-warning',
  CONFIRMED: 'tag-success',
  COMPLETED: 'tag-neutral',
  CANCELLED: 'tag-danger',
};

export function StatusTag({ status }) {
  const t = useT();
  const key = String(status || '').toUpperCase();
  return (
    <span className={STATUS_CLASS[key] || 'tag-neutral'}>
      <span className="dot" aria-hidden="true" />
      {STATUS_CLASS[key] ? t(`status.${key}`) : status || t('status.UNKNOWN')}
    </span>
  );
}

export function EmptyState({ title, description, action, className = '', as: Heading = 'p' }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center ${className}`}>
      <Heading className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</Heading>
      {description && <p className="mt-2 max-w-sm text-sm text-ink-2">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function PageLoader({ label }) {
  const t = useT();
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-ink-3" role="status">
      <span className="spinner" aria-hidden="true" />
      {label || t('common.loading')}…
    </div>
  );
}

export function Field({ label, htmlFor, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Notice({ tone = 'info', children, onDismiss }) {
  const t = useT();
  if (!children) return null;
  return (
    <div className={`notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-xs font-semibold opacity-70 hover:opacity-100">
          {t('common.dismiss')}
        </button>
      )}
    </div>
  );
}

export function Stat({ label, value, note, className = '' }) {
  return (
    <div className={className}>
      <p className="eyebrow">{label}</p>
      <p className="num mt-1.5 text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink">{value}</p>
      {note && <p className="mt-2 text-[13px] text-ink-3">{note}</p>}
    </div>
  );
}

// Formatting lives in i18n/format so prices follow the active language (₹, en-IN grouping).
export { money, shortMoney } from '../i18n/format';
