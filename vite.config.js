import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  // Allows GEMINI_API_KEY, TMDB_API_KEY, OMDB_API_KEY directly from .env
  envPrefix: ['VITE_', 'GEMINI_', 'TMDB_', 'OMDB_'],
})
