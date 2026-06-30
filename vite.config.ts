// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Secure fallback context calculation for __dirname under absolute ESM frameworks
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true
  },

  build: {
    chunkSizeWarningLimit: 800, // Raises threshold slightly to reflect functional dashboard weights
    rolldownOptions: {
      output: {
        codeSplitting: true, // Dynamically segment entry points
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Isolate Lucide icons because it scales with administrative interfaces
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            // Isolate core rendering engines
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react-core";
            }
            // Fallback chunk for all other isolated vendor packages
            return "vendor-utilities";
          }
        },
      },
    },
  },
});
