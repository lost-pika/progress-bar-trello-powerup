import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // ⭐ REQUIRED FIX
      preserveEntrySignatures: false,
      preserveModules: false,

      input: {
        main: 'index.html',
        cardProgress: 'src/entries/card-progress.html',
        settings: 'src/entries/settings.html',
        confirmRestart: 'src/entries/confirm-restart.html',
        autoTrack: 'src/entries/auto-track-lists.html',
      },

      output: {
        // ⭐ Force HTML output names in root of dist
        entryFileNames: (chunk) => {
          if (chunk.name === 'cardProgress') return 'card-progress.html'
          if (chunk.name === 'settings') return 'settings.html'
          if (chunk.name === 'confirmRestart') return 'confirm-restart.html'
          if (chunk.name === 'autoTrack') return 'auto-track-lists.html'
          return 'index.html'
        },

        // assets
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
