import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        whatsapp: "rgb(var(--color-whatsapp) / <alpha-value>)",
        chrome: "rgb(var(--color-chrome) / <alpha-value>)",
        app: "rgb(var(--color-app) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        buyerBlue: "#3A6EA5",
        border: "rgb(var(--color-border) / <alpha-value>)"
      },
      borderRadius: {
        card: "12px"
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.08), 0 12px 24px rgba(0,0,0,0.03)"
      }
    }
  },
  plugins: []
}

export default config
