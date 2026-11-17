/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        noir: {
          950: "#060608",
          900: "#0B0B0E",
          850: "#121217",
          800: "#191920",
          700: "#24242E",
          600: "#323240",
        },
        ivory: {
          50: "#FCFCF9",
          100: "#F7F6F1",
          200: "#EFECE4",
          300: "#E3DFD4",
          400: "#C8C3B4",
        },
        champagne: {
          light: "#F5E9CE",
          DEFAULT: "#D4AF37",
          hover: "#E6C875",
          dark: "#A38220",
          glow: "rgba(212, 175, 55, 0.15)",
        },
        platinum: {
          light: "#F0F0F3",
          DEFAULT: "#D8D8E0",
          dark: "#8E8E9E",
        },
        crimson: {
          DEFAULT: "#8E1D2D",
          light: "#B22B3F",
        }
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Italiana", "Cinzel", "serif"],
        display: ["Italiana", "Cinzel", "Cormorant Garamond", "serif"],
        heading: ["Syne", "Plus Jakarta Sans", "sans-serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      letterSpacing: {
        editorial: "0.22em",
        ultra: "0.35em",
        widest: "0.25em",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.16, 1, 0.3, 1)",
        editorial: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      animation: {
        'fade-in': 'fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
};
