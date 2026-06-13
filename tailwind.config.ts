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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          green: '#1B4332',
          'green-light': '#2D6A4F',
          'green-pale': '#D8F3DC',
          gold: '#D4A853',
          'gold-light': '#F0D080',
          bg: '#F9F6F1',
          'bg-card': '#FFFFFF',
          text: '#1A1A1A',
          'text-muted': '#6B7280',
        }
      },
    },
  },
  plugins: [],
};
export default config;
