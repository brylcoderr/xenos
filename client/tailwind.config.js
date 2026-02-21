/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#06060a',
          2: '#0c0c12',
          3: '#111118',
          4: '#16161f',
        },
        border: {
          DEFAULT: '#1a1a28',
          2: '#222233',
        },
        accent: {
          green: '#39e97b',
          purple: '#9b7cff',
          orange: '#ff7c3a',
          blue: '#3acdff',
          pink: '#f472b6',
          yellow: '#ffcc00',
        },
        muted: {
          DEFAULT: '#55556a',
          2: '#888899',
        },
        text: {
          DEFAULT: '#eeeef5',
          muted: '#64748b'
        },
        danger: '#ff4f4f',
      },
      fontFamily: {
        heading: ['Syne', 'Barlow Condensed', 'sans-serif'],
        body: ['DM Sans', 'Barlow', 'sans-serif'],
        mono: ['Space Mono', 'DM Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
