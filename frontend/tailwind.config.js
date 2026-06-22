/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs primaires — pilotées par variables CSS (theming dynamique)
        // Format : 'rgb(var(--p-NNN) / <alpha-value>)' permet bg-primary-700/50 etc.
        primary: {
          50:  'rgb(var(--p-50)  / <alpha-value>)',
          100: 'rgb(var(--p-100) / <alpha-value>)',
          200: 'rgb(var(--p-200) / <alpha-value>)',
          300: 'rgb(var(--p-300) / <alpha-value>)',
          400: 'rgb(var(--p-400) / <alpha-value>)',
          500: 'rgb(var(--p-500) / <alpha-value>)',
          600: 'rgb(var(--p-600) / <alpha-value>)',
          700: 'rgb(var(--p-700) / <alpha-value>)',
          800: 'rgb(var(--p-800) / <alpha-value>)',
          900: 'rgb(var(--p-900) / <alpha-value>)',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#C9A84C',
          600: '#b45309',
        },
        guinea: {
          50:  '#fff1f2',
          100: '#ffd9dc',
          200: '#ffb3b8',
          300: '#ff8088',
          400: '#f03a47',
          500: '#CE1126',
          600: '#a50d1e',
          700: '#7d0a17',
        },
        dark: {
          50:  '#f5f2eb',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:        '0 2px 12px rgba(0,0,0,0.07)',
        'card-hover':'0 10px 32px rgba(27,139,59,0.10), 0 4px 12px rgba(0,0,0,0.06)',
        premium:     '0 4px 20px rgba(var(--p-700) / 0.22)',
        warm:        '0 4px 24px rgba(27,139,59,0.08), 0 1px 6px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        xl:  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
