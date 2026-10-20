/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ald: {
          bg: 'var(--ald-bg)',
          surface: 'var(--ald-surface)',
          card: 'var(--ald-card)',
          border: 'var(--ald-border)',
          'border-hi': 'var(--ald-border-hi)',
          muted: 'var(--ald-muted)',
          text: 'var(--ald-text)',
          accent: 'var(--ald-accent)',
          'accent-hi': 'var(--ald-accent-hi)',
          success: 'var(--ald-success)',
          warning: 'var(--ald-warning)',
          error: 'var(--ald-error)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.18s ease-out',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'flash': 'flash 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { from: { transform: 'scale(0.92)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        flash: {
          '0%': { opacity: '0' },
          '20%': { opacity: '0.9' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
