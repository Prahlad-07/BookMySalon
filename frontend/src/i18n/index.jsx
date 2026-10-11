/**
 * Minimal i18n for BookMySalon — no dependency needed for what we use:
 *   t('key', { name })          interpolation with {name}
 *   t('key', { count })         plurals via `key_one` / `key_other` (Intl.PluralRules)
 *   <Rich text={t('key')} />    renders <em>…</em> spans inside a translation
 * Missing keys fall back to English, then to the key itself, so a partial
 * translation never breaks a page.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en';
import { DEFAULT_LANGUAGE, LANGUAGES, SCRIPT_FONT, languageOf } from './languages';
import { setFormatLanguage } from './format';

const STORAGE_KEY = 'bms.language';
const loaders = import.meta.glob(['./locales/*.js', '!./locales/en.js']);

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const detectLanguage = () => {
  const stored = readStored();
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  const preferred = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
  for (const tag of preferred) {
    const base = String(tag || '').toLowerCase().split('-')[0];
    if (LANGUAGES.some((l) => l.code === base)) return base;
  }
  return DEFAULT_LANGUAGE;
};

const loadScriptFont = (script) => {
  const family = SCRIPT_FONT[script];
  const root = document.documentElement;
  if (!family) {
    root.style.removeProperty('--script-sans');
    root.style.removeProperty('--script-serif');
    return;
  }
  const id = `font-${script}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    const fam = family.replace(/ /g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=Noto+Sans+${fam}:wght@400;500;600;700&family=Noto+Serif+${fam}:wght@400;500&display=swap`;
    document.head.appendChild(link);
  }
  root.style.setProperty('--script-sans', `"Noto Sans ${family}"`);
  root.style.setProperty('--script-serif', `"Noto Serif ${family}"`);
};

const interpolate = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] != null ? String(vars[name]) : match)) : text;

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(detectLanguage);
  // The dictionary on screen and the language it belongs to change together,
  // so a slow chunk never pairs new plural rules with old strings.
  const [loaded, setLoaded] = useState({ code: 'en', dict: en });

  useEffect(() => {
    let cancelled = false;
    const meta = languageOf(language);
    const apply = (code, dict) => {
      if (cancelled) return;
      const shown = languageOf(code);
      setFormatLanguage(shown.code);
      document.documentElement.lang = shown.code;
      document.documentElement.dataset.script = shown.script;
      loadScriptFont(shown.script);
      setLoaded({ code: shown.code, dict });
    };
    const load = meta.code === 'en' ? null : loaders[`./locales/${meta.code}.js`];
    if (!load) {
      apply('en', en);
    } else {
      load().then(
        (m) => apply(meta.code, m.default),
        () => apply('en', en)
      );
    }
    return () => {
      cancelled = true;
    };
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* private mode — the choice simply won't persist */
    }
    setLanguageState(code);
  }, []);

  const { dict, code: activeCode } = loaded;

  const t = useCallback(
    (key, vars) => {
      let lookupKey = key;
      if (vars && typeof vars.count === 'number') {
        const form = new Intl.PluralRules(activeCode).select(vars.count);
        const formKey = `${key}_${form}`;
        if (dict[formKey] != null || en[formKey] != null) lookupKey = formKey;
        else if (dict[`${key}_other`] != null || en[`${key}_other`] != null) lookupKey = `${key}_other`;
      }
      const text = dict[lookupKey] ?? en[lookupKey] ?? key;
      return interpolate(text, vars);
    },
    [dict, activeCode]
  );

  const value = useMemo(
    () => ({ t, language: activeCode, requested: language, setLanguage, languages: LANGUAGES }),
    [t, activeCode, language, setLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

/** Shorthand for components that only need `t`. */
export const useT = () => useI18n().t;

/** Renders a translated string that marks emphasis with <em>…</em> and line breaks with <br>. */
export function Rich({ text, emClassName = 'italic' }) {
  const parts = String(text).split(/(<em>.*?<\/em>|<br>)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === '<br>') return <br key={i} />;
        const em = part.match(/^<em>(.*)<\/em>$/);
        if (em) {
          return (
            <em key={i} className={emClassName}>
              {em[1]}
            </em>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
