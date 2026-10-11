/**
 * Design tokens live as CSS variables in src/index.css so light/dark themes
 * swap without class changes. Tailwind only maps names to those variables.
 */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',

      paper: v('paper'),
      surface: v('surface'),
      sunken: v('sunken'),
      line: v('line'),
      'line-strong': v('line-strong'),
      ink: {
        DEFAULT: v('ink'),
        2: v('ink-2'),
        3: v('ink-3'),
      },
      accent: {
        DEFAULT: v('accent'),
        hover: v('accent-hover'),
        soft: v('accent-soft'),
        ink: v('accent-ink'),
      },
      sage: { DEFAULT: v('sage'), soft: v('sage-soft') },
      gold: v('gold'),
      success: { DEFAULT: v('success'), soft: v('success-soft') },
      warning: { DEFAULT: v('warning'), soft: v('warning-soft') },
      danger: { DEFAULT: v('danger'), soft: v('danger-soft') },

      // Legacy aliases kept so map widgets and untouched markup stay on-palette.
      slate: {
        50: v('sunken'), 100: v('sunken'), 200: v('line'), 300: v('line-strong'),
        400: v('ink-3'), 500: v('ink-3'), 600: v('ink-2'), 700: v('ink-2'),
        800: v('ink'), 900: v('ink'),
      },
      primary: {
        50: v('accent-soft'), 100: v('accent-soft'), 200: v('accent-soft'),
        300: v('accent'), 500: v('accent'), 600: v('accent'), 700: v('accent'),
      },
      red: { 50: v('danger-soft'), 500: v('danger'), 600: v('danger'), 700: v('danger') },
      emerald: { 500: v('success'), 600: v('success'), 700: v('success') },
      amber: { 400: v('gold'), 500: v('gold'), 700: v('warning') },
    },
    fontFamily: {
      // --script-* is set per language (Noto Devanagari, Tamil, …). Latin glyphs
      // keep the brand faces; Indic glyphs fall through to the Noto family.
      sans: ['"Instrument Sans"', 'var(--script-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      display: ['"Instrument Serif"', 'var(--script-serif)', 'ui-serif', 'Georgia', 'serif'],
      mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    extend: {
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
      },
      letterSpacing: {
        label: '0.14em',
      },
      maxWidth: {
        shell: '76rem',
      },
      boxShadow: {
        lift: '0 1px 0 rgb(var(--line) / 1), 0 12px 32px -18px rgb(var(--shadow) / 0.35)',
        pop: '0 24px 60px -24px rgb(var(--shadow) / 0.45)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        rise: 'rise 380ms cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
};
