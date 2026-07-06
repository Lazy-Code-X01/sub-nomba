import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface2)",
          3: "var(--surface3)",
        },
        stroke: {
          DEFAULT: "var(--border)",
          2: "var(--border2)",
        },
        label: {
          DEFAULT: "var(--text)",
          2: "var(--text2)",
          3: "var(--text3)",
        },
        "sidebar-bg": "var(--sidebar-bg)",
        "sidebar-surface": "var(--sidebar-surface)",
        "sidebar-hover": "var(--sidebar-hover)",
        "sidebar-border": "var(--sidebar-border)",
        "sidebar-text": "var(--sidebar-text)",
        "sidebar-text2": "var(--sidebar-text2)",
        "sidebar-text3": "var(--sidebar-text3)",
        yellow: {
          DEFAULT: "var(--yellow)",
          dim: "var(--yellow-dim)",
          glow: "var(--yellow-glow)",
        },
        green: {
          DEFAULT: "var(--green)",
          dim: "var(--green-dim)",
        },
        red: {
          DEFAULT: "var(--red)",
          dim: "var(--red-dim)",
        },
        blue: {
          DEFAULT: "var(--blue)",
          dim: "var(--blue-dim)",
        },
        amber: {
          DEFAULT: "var(--amber)",
          dim: "var(--amber-dim)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "var(--shadow)",
        "card-sm": "var(--shadow-sm)",
      },
    },
  },
  plugins: [],
};

export default config;
