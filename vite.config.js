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
      },

      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'cardProgress') return 'card-progress.html'
          if (chunk.name === 'settings') return 'settings.html'
          if (chunk.name === 'confirmRestart') return 'confirm-restart.html'
          if (chunk.name === 'autoTrack') return 'auto-track-lists.html'
          return 'index.html'
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },

      plugins: [
        {
          name: 'remove-nested-html',
          generateBundle(_, bundle) {
            for (const file of Object.keys(bundle)) {
              if (file.startsWith('src/entries/') && file.endsWith('.html')) {
                delete bundle[file]
              }
            }
          }
        }
      ]
    },
  },
})
