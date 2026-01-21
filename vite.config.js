import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        cardProgress: "public/card-progress.html",
        settings: "public/settings.html",
        confirmRestart: "public/confirm-restart.html",
        autoTrack: "public/auto-track-lists.html",
      },
    },
  },
  publicDir: "public",
});
