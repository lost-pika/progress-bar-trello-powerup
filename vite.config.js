import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',

        cardProgress: 'src/entries/card-progress.html',
        settings: 'src/entries/settings.html',
        confirmRestart: 'src/entries/confirm-restart.html',
        autoTrack: 'src/entries/auto-track-lists.html',
      }
    }
  }
})
