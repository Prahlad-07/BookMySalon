/**
 * Small, shared presentational primitives. Keep these dumb: no data fetching.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useT } from '../i18n';

export function Wordmark({ to = '/', className = '' }) {
  const t = useT();
  return (
    <Link to={to} className={`group inline-flex items-center gap-2.5 ${className}`} aria-label={t('nav.home')}>
      <span
        aria-hidden="true"
        className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-accent font-display text-[19px] italic leading-none text-accent-ink"
      >
        b
      </span>
      <span className="font-display text-[23px] leading-none tracking-[-0.01em] text-ink">
        BookMy<span className="italic">Salon</span>
      </span>
    </Link>
  );
}

export function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <header className={`flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display text-[44px] text-ink sm:text-[56px]">{title}</h1>
        {description && <p className="lede mt-3 max-w-xl">{description}</p>}
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

export function EmptyState({ title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-16 text-center ${className}`}>
      <p className="display text-[30px] text-ink">{title}</p>
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
      <p className="num mt-2 font-display text-[40px] leading-none text-ink">{value}</p>
      {note && <p className="mt-2 text-[13px] text-ink-3">{note}</p>}
    </div>
  );
}

// Formatting lives in i18n/format so prices follow the active language (₹, en-IN grouping).
export { money, shortMoney } from '../i18n/format';
