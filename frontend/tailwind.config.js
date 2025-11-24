/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      keyframes: {
        "gradient-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "neon-breathe": {
          "0%, 100%": {
            opacity: "0.6",
            transform: "scale(1)",
            filter: "drop-shadow(0 0 6px #22d3ee)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.04)",
            filter: "drop-shadow(0 0 16px #22d3ee)",
          },
        }
      },

      animation: {
        "gradient-flow": "gradient-flow 6s ease-in-out infinite",
        "neon-breathe": "neon-breathe 4s ease-in-out infinite",
      },
    },
  },

  plugins: [],
};
