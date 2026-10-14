/**
 * Languages offered in the app. English ships in the main bundle; every other
 * locale is a lazily loaded chunk. `script` drives which Noto font family is
 * fetched so Indic text renders with proper shaping instead of a system fallback.
 */
export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', script: 'latn' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', script: 'deva' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', script: 'beng' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'deva' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', script: 'telu' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'taml' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'gujr' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'knda' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', script: 'mlym' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'guru' },
];

export const DEFAULT_LANGUAGE = 'en';

export const SCRIPT_FONT = {
  deva: 'Devanagari',
  beng: 'Bengali',
  telu: 'Telugu',
  taml: 'Tamil',
  gujr: 'Gujarati',
  knda: 'Kannada',
  mlym: 'Malayalam',
  guru: 'Gurmukhi',
};

export const languageOf = (code) => LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
