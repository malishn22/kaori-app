/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        theme: {
          bg:     'var(--color-bg)',
          bg2:    'var(--color-bg2)',
          paper:  'var(--color-paper)',
          paper2: 'var(--color-paper2)',
          line:   'var(--color-line)',
          line2:  'var(--color-line2)',
          ink:    'var(--color-ink)',
          ink2:   'var(--color-ink2)',
          ink3:   'var(--color-ink3)',
          ink4:   'var(--color-ink4)',
          amber:  'var(--color-amber)',
          cream:  'var(--color-cream)',
        },
        'on-accent': '#1a140a',
        delete: '#c97060',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
