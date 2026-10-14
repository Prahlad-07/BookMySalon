/**
 * Locale-aware formatting for the Indian market: rupees with Indian digit
 * grouping (₹1,25,000), and dates/times in the active language. Digits stay
 * Latin (`-u-nu-latn`) because that is what people read on prices and receipts.
 *
 * The active language is held at module level so plain helpers (not only
 * components) format consistently; I18nProvider updates it before re-rendering.
 */
let activeLanguage = 'en';

export const setFormatLanguage = (code) => {
  activeLanguage = code || 'en';
};

export const intlLocale = () => `${activeLanguage}-IN-u-nu-latn`;

const cache = new Map();
const formatter = (kind, options) => {
  const key = `${activeLanguage}|${kind}|${JSON.stringify(options)}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      kind === 'number' ? new Intl.NumberFormat(intlLocale(), options) : new Intl.DateTimeFormat(intlLocale(), options)
    );
  }
  return cache.get(key);
};

const toDate = (value) => (value instanceof Date ? value : new Date(value));

/** ₹1,499 — paise are shown only when the amount actually has them. */
export const money = (value) => {
  const n = Number(value || 0);
  return formatter('number', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export const shortMoney = money;

export const formatNumber = (value, options = {}) => formatter('number', options).format(Number(value || 0));

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  formatter('date', options).format(toDate(value));

export const formatTime = (value) => formatter('date', { hour: 'numeric', minute: '2-digit' }).format(toDate(value));

/** "5 min ago" / "५ मिनट पहले" — falls back to a date for anything older than a week. */
export const relativeTime = (value) => {
  const ts = toDate(value).getTime();
  if (Number.isNaN(ts)) return '';
  const minutes = Math.round((ts - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'auto', style: 'short' });
  if (Math.abs(minutes) < 1) return rtf.format(0, 'minute');
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  if (Math.abs(minutes) < 1440) return rtf.format(Math.round(minutes / 60), 'hour');
  if (Math.abs(minutes) < 10080) return rtf.format(Math.round(minutes / 1440), 'day');
  return formatDate(ts, { day: 'numeric', month: 'short' });
};

/** "Today" / "Tomorrow" / "In 3 days" in the active language, or null beyond a week. */
export const relativeDay = (value) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(toDate(value).getTime()); // copy — never mutate the caller's date
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff < 0 || diff >= 7) return null;
  const text = new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'auto' }).format(diff, 'day');
  return text.charAt(0).toLocaleUpperCase(intlLocale()) + text.slice(1);
};

/** ₹1.5L / ₹2Cr — Indian compact units for chart axes and tight stat cells. */
export const compactMoney = (value) =>
  formatter('number', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(value || 0)
  );

/** Full rupees up to a lakh, compact (₹2.4L) beyond — keeps large stat figures on one line. */
export const statMoney = (value) => (Math.abs(Number(value || 0)) >= 100000 ? compactMoney(value) : money(value));
