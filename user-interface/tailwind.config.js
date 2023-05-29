module.exports = {
  content: ['./src/**/*.{html,js,ts}'],
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: ['dark']
  }
};
