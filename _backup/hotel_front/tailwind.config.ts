import { heroui } from "@heroui/theme";
import type { Config } from "tailwindcss";
const { addDynamicIconSelectors } = require("@iconify/tailwind");

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/components/(accordion|autocomplete|badge|breadcrumbs|button|calendar|card|checkbox|chip|date-picker|divider|dropdown|input|modal|pagination|popover|select|spinner|toggle|table|toast|ripple|form|listbox|scroll-shadow|date-input|menu|spacer).js"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
      },
      rotate: {
        "270": "270deg",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui(), addDynamicIconSelectors()],
} satisfies Config;
