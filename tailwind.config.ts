import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        pop: { "0%": { transform: "scale(.96)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        pop: "pop .25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
