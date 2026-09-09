import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative assets make the same build work at /repo-name/ on GitHub Pages
  // and at / when a custom domain is added later.
  base: './',
})
