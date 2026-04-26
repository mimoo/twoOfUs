import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./quizzes/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF1E0",
        ink: "#14131F",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "p2-color": "var(--p2-color)",
        "quad-tl": "var(--quad-tl)",
        "quad-tr": "var(--quad-tr)",
        "quad-bl": "var(--quad-bl)",
        "quad-br": "var(--quad-br)",
        "ink-soft": "var(--ink-soft)",
        "ink-muted": "var(--ink-muted)",
        "ink-faint": "var(--ink-faint)",
        "ink-fade": "var(--ink-fade)",
        "ink-tint": "var(--ink-tint)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Fraunces", "serif"],
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
