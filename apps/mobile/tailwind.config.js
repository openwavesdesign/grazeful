/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2D7A4F',
        primaryLight: '#E8F5EE',
        dark: '#1A1A1A',
        grayText: '#666666',
        border: '#E0E0E0',
        background: '#F9F9F9',
        warning: '#F0A500',
        error: '#D93025',
        score5: '#2D7A4F',
        score4: '#6BBF6B',
        score3: '#F0A500',
        score2: '#E07830',
        score1: '#D93025',
      },
    },
  },
  plugins: [],
};
