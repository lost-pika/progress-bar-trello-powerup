import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",

        settings: "src/views/settings.html",
        cardProgress: "src/views/card-progress.html",
        confirmRestart: "src/views/confirm-restart.html",
        autoTrack: "src/views/auto-track-lists.html",
        cardDetail: "src/views/card-detail-progress.html",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
