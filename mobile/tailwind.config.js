/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#10B981",
        background: "#F3F4F6",
        surface: "#FFFFFF",
        text: "#1F2937",
        textLight: "#6B7280",
        error: "#EF4444",
      },
    },
  },
  plugins: [],
}
