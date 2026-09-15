/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          light: '#132C52',
          dark: '#071427',
        },
        brand: {
          green: '#2E8B57',
          greenDark: '#256F46',
          greenLight: '#E4F3EA',
        },
        surface: '#F5F7FA',
        ink: '#1F2937',
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(11, 31, 58, 0.06)',
        cardHover: '0 8px 24px rgba(11, 31, 58, 0.10)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
