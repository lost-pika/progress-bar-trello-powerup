import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        cardProgress: 'src/entries/card-progress.jsx',
        settings: 'src/entries/settings.jsx',
        confirmRestart: 'src/entries/confirm-restart.jsx',
        autoTrack: 'src/entries/auto-track-lists.jsx',
      },
    },

    // Output HTML files in dist root
    outDir: "dist",
  },
});

