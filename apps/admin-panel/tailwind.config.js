/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@repo/tailwind-preset/preset')],
  content: ['./app/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};
