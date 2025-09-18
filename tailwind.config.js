// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'bremen-blue': '#002b55',  // University of Bremen blue
        'bremen-red': '#be1e2d',   // Optional secondary brand color
      },
    },
  },
  plugins: [],
};
