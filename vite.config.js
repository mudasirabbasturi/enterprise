import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    laravel({
      input: "resources/js/app.jsx",
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
});
