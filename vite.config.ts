import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Build identifier injected at build time. Used by both the runtime
// version-check (public/version.json) and to invalidate the service worker
// cache on every deployment.
const BUILD_ID = `${Date.now()}`;

// Vite plugin that writes /version.json into the build output. The frontend
// polls this file to detect new deployments and force-refresh stale clients.
function versionJsonPlugin(): Plugin {
  const payload = () =>
    JSON.stringify(
      {
        version: BUILD_ID,
        buildTime: new Date().toISOString(),
      },
      null,
      2,
    );

  return {
    name: "rbn-version-json",
    // Serve /version.json in dev so the version-check hook works locally.
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/version.json", (_req: unknown, res: any) => {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store, must-revalidate");
        res.end(payload());
      });
    },
    // Emit /version.json into the production bundle.
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: payload(),
      });
    },
    // Also rewrite the source SW so __BUILD_ID__ gets a real value at build time.
    closeBundle() {
      const swPath = path.resolve(__dirname, "dist/service-worker.js");
      if (fs.existsSync(swPath)) {
        const original = fs.readFileSync(swPath, "utf8");
        fs.writeFileSync(swPath, original.replace(/__BUILD_ID__/g, BUILD_ID));
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    versionJsonPlugin(),
  ].filter(Boolean),
  define: {
    // Available at runtime via `import.meta.env.VITE_BUILD_ID` and `__BUILD_ID__`.
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: {
    // Vite hashes JS/CSS by default; pin the patterns explicitly so future
    // changes can't accidentally produce un-hashed asset names.
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
