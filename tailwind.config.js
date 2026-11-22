/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pogo: {
          sky: {
            50: 'var(--pogo-sky-50)',
            100: 'var(--pogo-sky-100)',
            200: 'var(--pogo-sky-200)',
            300: 'var(--pogo-sky-300)',
            400: 'var(--pogo-sky-400)',
          },
          cerulean: {
            400: 'var(--pogo-cerulean-400)',
            500: 'var(--pogo-cerulean-500)',
            600: 'var(--pogo-cerulean-600)',
            700: 'var(--pogo-cerulean-700)',
            800: 'var(--pogo-cerulean-800)',
            900: 'var(--pogo-cerulean-900)',
          },
          ink: {
            strong: 'var(--pogo-ink-strong)',
            primary: 'var(--pogo-ink-primary)',
            secondary: 'var(--pogo-ink-secondary)',
            muted: 'var(--pogo-ink-muted)',
          },
        },
        slate: {
          350: '#b0becf',
          650: '#3c4a5e',
          750: '#273549',
          850: '#162032',
        },
        rose: {
          350: '#fc8d9d',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Outfit"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'pogo-pill': '0 3px 10px rgba(8, 88, 120, 0.14)',
        'pogo-pill-active': '0 4px 14px rgba(9, 112, 152, 0.30)',
        'pogo-glass': '0 6px 22px rgba(10, 88, 122, 0.10)',
        'pogo-fab': '0 4px 14px rgba(12, 82, 110, 0.22)',
      },
      spacing: {
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
