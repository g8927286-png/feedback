/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2F4F3",
        "paper-dim": "#E8EBE9",
        ink: "#1B2130",
        navy: {
          DEFAULT: "#1E2F52",
          deep: "#121B31",
          soft: "#2E4270",
        },
        gold: {
          DEFAULT: "#C6982F",
          soft: "#E4C578",
          deep: "#9C7620",
        },
        teal: {
          DEFAULT: "#3C7859",
          soft: "#DCEBE2",
        },
        brick: {
          DEFAULT: "#AE4438",
          soft: "#F3DEDA",
        },
        line: "#D6DBD8",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Public Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18, 27, 49, 0.04), 0 8px 24px -12px rgba(18, 27, 49, 0.18)",
        lift: "0 20px 40px -20px rgba(18, 27, 49, 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "dial-fill": {
          "0%": { strokeDashoffset: "251" },
        },
        "rise": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
