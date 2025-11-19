import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
    }),
  ],

  // 👇 ТОВА ПОПРАВЯ ВСИЧКО (най-важното)
  optimizeDeps: {
    include: ["react-router-dom"]
  },

  build: {
    target: "esnext",
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    manifest: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
      },
    },
  },

  server: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    allowedHosts: ['.replit.dev']
  },
  
  vite: {
    server: {
      host: true,
      port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
      allowedHosts: ['.replit.dev']
    }
  }
});
