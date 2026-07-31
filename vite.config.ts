import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { version } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // App version injected from package.json at build time (shown in the More menu / sidebar).
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "::",
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // Only split off the large, rarely-co-imported libraries. Keep
          // react/react-dom/radix/supabase together in the default vendor
          // chunk — splitting those further creates circular chunk edges
          // since they reference each other constantly.
          if (id.includes("@tiptap") || id.includes("prosemirror")) return "tiptap-vendor";
          if (id.includes("xlsx")) return "xlsx-vendor";
          if (id.includes("recharts")) return "charts-vendor";
          if (id.includes("html5-qrcode") || id.includes("/qrcode/")) return "qr-vendor";
          return "vendor";
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // The main bundle can exceed workbox's 2 MiB default as the app grows;
        // raise the precache limit so the PWA build doesn't fail on that alone.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
      manifest: {
        name: 'RBN | Rajput Business Network',
        short_name: 'RBN',
        description: 'Rajput Business Network - Connecting business professionals',
        theme_color: '#3D4F5F',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
