import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { metaImagesPlugin } from "./vite-plugin-meta-images";
import { VitePWA } from "vite-plugin-pwa";

// defineConfig's TypeScript types don't allow an async function return value.
// Rather than fight the typing we simply silence the checker here.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: async config function
export default defineConfig((async () => {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
    metaImagesPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "opengraph.jpg"],
      manifest: {
        name: "My Michelin Restaurant",
        short_name: "Michelin POS",
        description: "Sistema interno de sala e cozinha",
        theme_color: "#0B0F14",
        background_color: "#0B0F14",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.jpg",
            sizes: "192x108",
            type: "image/jpeg",
          },
          {
            src: "/icons/icon-512.jpg",
            sizes: "512x288",
            type: "image/jpeg",
          },
          {
            src: "/icons/icon-512-maskable.jpg",
            sizes: "512x288",
            type: "image/jpeg",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,ico,json}"],
      },
    }),
  ];

  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const carto = await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer());
    const banner = await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner());
    plugins.push(carto, banner);
  }

  return {
    plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
        modules: {
          localsConvention: "camelCase",
        },
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // split heavy deps to keep main chunk smaller
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react")) return "vendor-react";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("socket.io-client")) return "vendor-socket";
          if (id.includes("framer-motion")) return "vendor-motion";
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  optimizeDeps: {
    exclude: ["lightningcss"],
  },
  ssr: {
    noExternal: ["lightningcss"],
  },
};
}) as any);
