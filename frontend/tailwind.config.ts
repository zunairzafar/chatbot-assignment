import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f7fb',
          100: '#e8edf7',
          200: '#c8d4ea',
          300: '#9fb3d6',
          400: '#6f89bf',
          500: '#4b67a6',
          600: '#3a4f84',
          700: '#2b3b63',
          800: '#1b263f',
          900: '#101827',
        },
        amber: {
          400: '#f6bd60',
          500: '#f39c38',
        },
        teal: {
          400: '#5cc8b8',
          500: '#2fa99a',
        },
      },
      boxShadow: {
        glow: '0 24px 80px rgba(16, 24, 39, 0.22)',
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at top left, rgba(92, 200, 184, 0.22), transparent 28%), radial-gradient(circle at right center, rgba(243, 156, 56, 0.18), transparent 32%), linear-gradient(135deg, #09111f 0%, #111c33 50%, #0d1728 100%)',
      },
    },
  },
  plugins: [forms],
}

export default config
