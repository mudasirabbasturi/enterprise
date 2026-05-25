import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/js/app.jsx", "resources/css/main.css"],
      refresh: true,
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      "@layout": path.resolve(
        __dirname,
        "resources/js/Dashboard/Layout/Layout"
      ),
      "@agConfig": path.resolve(
        __dirname,
        "resources/js/Dashboard/Components/AgGrid"
      ),
      "@ziggy": path.resolve(__dirname, "vendor/tightenco/ziggy"),
      "@shared/ui": path.resolve(
        __dirname,
        "resources/js/Dashboard/Components/Shared/Ui"
      ),
      "@modal": path.resolve(
        __dirname,
        "resources/js/Dashboard/Components/Modal"
      ),
      "@component": path.resolve(
        __dirname,
        "resources/js/Dashboard/Components"
      ),
      "@pages": path.resolve(__dirname, "resources/js/Dashboard/Pages"),
    },
  },
  server: {
    host: "localhost", // or '0.0.0.0' if you want LAN access
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost", // force HMR to use localhost instead of [::1]
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            const directories = id.toString().split("node_modules/")[1].split("/");
            const name = directories[0].startsWith("@") ? directories[0] + "-" + directories[1] : directories[0];
            return `npm-${name}`;
          }
        },
      },
    },
  },
});
