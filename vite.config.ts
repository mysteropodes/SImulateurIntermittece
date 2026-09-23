// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

/** Donne au service worker une version unique à chaque build, pour que l'application installée se mette à jour seule. */
const versionServiceWorker = () => ({
  name: "version-service-worker",
  apply: "build" as const,
  closeBundle() {
    const fichier = path.resolve(__dirname, "dist/sw.js");
    if (!existsSync(fichier)) return;
    const version = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    writeFileSync(fichier, readFileSync(fichier, "utf8").replace(/__VERSION__/g, version));
  },
});

export default defineConfig({
  plugins: [react(), versionServiceWorker()],
  base: '/SImulateurIntermittece/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});