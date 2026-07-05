/** @type {import('tailwindcss').Config} */
import logimapPreset from '@logimap/ui/tailwind'

export default {
  presets: [logimapPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
}
