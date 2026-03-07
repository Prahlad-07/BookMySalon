const pad2 = (value) => String(value).padStart(2, '0');

const toFiniteNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeFromHourMinute = (hour, minute) => {
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

export const parseTimeParts = (value) => {
  if (value == null || value === '') return null;

  if (typeof value === 'string' && value.includes(':')) {
    const [hourPart, minutePart] = value.split(':');
    return normalizeFromHourMinute(Number(hourPart), Number(minutePart));
  }

  const numeric = toFiniteNumber(value);
  if (numeric == null || numeric < 0) return null;

  if (numeric <= 23) {
    return normalizeFromHourMinute(Math.trunc(numeric), 0);
  }

  // Legacy data case such as 90/180 meaning 09:00 / 18:00.
  if (numeric <= 240 && numeric % 10 === 0) {
    return normalizeFromHourMinute(Math.trunc(numeric / 10), 0);
  }

  // HHmm format such as 930, 1830.
  if (numeric <= 2359) {
    const hour = Math.trunc(numeric / 100);
    const minute = Math.trunc(numeric % 100);
    const hhmm = normalizeFromHourMinute(hour, minute);
    if (hhmm) return hhmm;
  }

  // Minute-of-day fallback.
  if (numeric < 24 * 60) {
    const hour = Math.trunc(numeric / 60);
    const minute = Math.trunc(numeric % 60);
    return normalizeFromHourMinute(hour, minute);
  }

  return null;
};

export const toTimeInputValue = (value, fallback = '09:00') => {
  const parts = parseTimeParts(value);
  if (!parts) return fallback;
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
};

export const toMinuteOfDay = (value) => {
  const parts = parseTimeParts(value);
  if (!parts) return null;
  return parts.hour * 60 + parts.minute;
};

export const formatTimeLabel = (value, fallback = '--:--') => {
  const parts = parseTimeParts(value);
  if (!parts) return fallback;
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
};

export const formatTimeRange = (openTime, closeTime) =>
  `${formatTimeLabel(openTime, '09:00')} - ${formatTimeLabel(closeTime, '18:00')}`;

export const formatDurationLabel = (minutesValue) => {
  const minutes = Number(minutesValue);
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
};
