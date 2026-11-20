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
        bg: {
          DEFAULT: "var(--bg)",
          alt: "var(--bg-alt)",
        },
        surface: "var(--surface)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        border: "var(--border)",
        accent: {
          DEFAULT: "var(--accent)",
          contrast: "var(--accent-contrast)",
          hover: "var(--color-accent-hover)",
          light: "var(--color-accent-light)",
          dark: "var(--color-accent-dark)",
          glow: "var(--color-accent-glow)",
        },
        "inverse-bg": "var(--inverse-bg)",
        "inverse-text": "var(--inverse-text)",
        status: {
          success: "var(--status-success)",
          error: "var(--status-error)",
          warning: "var(--status-warning)",
        },
        noir: {
          950: "#060608",
          900: "#0B0B0E",
          850: "#121217",
          800: "#191920",
          700: "#24242E",
          600: "#323240",
        },
        ivory: {
          50: "var(--bg)",
          100: "var(--bg-alt)",
          200: "var(--border)",
          300: "#DFD6C9",
          400: "#C6BBAE",
        },
        champagne: {
          light: "var(--color-accent-light)",
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          dark: "var(--color-accent-dark)",
          glow: "var(--color-accent-glow)",
        },
        platinum: {
          light: "var(--surface)",
          DEFAULT: "var(--border)",
          dark: "var(--text-muted)",
        },
        crimson: {
          DEFAULT: "var(--status-error)",
          light: "#B22B3F",
        }
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Italiana", "Cinzel", "serif"],
        display: ["Cormorant Garamond", "Italiana", "Cinzel", "serif"],
        heading: ["Plus Jakarta Sans", "Syne", "sans-serif"],
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
