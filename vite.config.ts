import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

// defineConfig's TypeScript types don't allow an async function return value.
// Rather than fight the typing we simply silence the checker here.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: async config function
export default defineConfig((async () => {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
    metaImagesPlugin(),
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
