import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: "dist",

    rollupOptions: {
      input: {
        main: "index.html",

        // --- Correct paths (views folder) ---
        settings: "src/views/settings.html",
        cardProgress: "src/views/card-progress.html",
        cardDetail: "src/views/card-detail-progress.html",
        autoTrack: "src/views/auto-track-lists.html",
        confirmRestart: "src/views/confirm-restart.html",
      },

      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
