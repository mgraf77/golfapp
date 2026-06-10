import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works at any mount path (root, GitHub Pages /golfapp/, etc).
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
})
