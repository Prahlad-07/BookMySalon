/**
 * Language picker. `menu` is the compact navbar dropdown, `select` a native
 * select for the footer, `grid` the full chooser used in account settings.
 * Each language is labelled in its own script so people can find theirs
 * without reading the current UI language.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Check, Languages } from 'lucide-react';
import { useI18n } from '../i18n';

export default function LanguageSwitcher({ variant = 'menu', className = '' }) {
  const { language, setLanguage, languages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'select') {
    return (
      <label className={`inline-flex items-center gap-2 ${className}`}>
        <Languages size={15} strokeWidth={1.75} className="text-ink-3" aria-hidden="true" />
        <span className="sr-only">{t('lang.label')}</span>
        <select
          className="field h-9 w-auto py-0 pr-9 text-[13px]"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code} lang={l.code}>
              {l.native}
              {l.code !== 'en' ? ` · ${l.name}` : ''}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${className}`} role="radiogroup" aria-label={t('lang.label')}>
        {languages.map((l) => {
          const active = l.code === language;
          return (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLanguage(l.code)}
              className={`flex items-center justify-between gap-2 rounded-md border px-3.5 py-2.5 text-left transition ${
                active ? 'border-ink bg-surface' : 'border-line hover:border-line-strong'
              }`}
            >
              <span className="min-w-0">
                <span lang={l.code} className="block truncate text-[15px] font-medium text-ink">
                  {l.native}
                </span>
                <span className="block text-[12px] text-ink-3">{l.name}</span>
              </span>
              {active && <Check size={16} className="shrink-0 text-accent" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[13.5px] font-medium text-ink-2 transition hover:bg-sunken hover:text-ink"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${t('lang.label')}: ${current.native}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Languages size={16} strokeWidth={1.75} aria-hidden="true" />
        <span lang={current.code} className="hidden sm:inline">
          {current.native}
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t('lang.label')}
          className="animate-fade absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-lg border border-line bg-surface p-1.5 shadow-pop"
        >
          {languages.map((l) => {
            const active = l.code === language;
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-sunken ${
                    active ? 'text-ink' : 'text-ink-2'
                  }`}
                >
                  <span lang={l.code} className={active ? 'font-semibold' : ''}>
                    {l.native}
                  </span>
                  <span className="flex items-center gap-2 text-[12px] text-ink-3">
                    {l.code !== 'en' && l.name}
                    {active && <Check size={14} className="text-accent" aria-hidden="true" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
