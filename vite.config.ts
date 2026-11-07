import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";

const adminDevRoutes = (): Plugin => ({
  name: "admin-dev-routes",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const requestUrl = request.url ?? "/";
      const [pathname, query] = requestUrl.split("?", 2);

      if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        request.url = `/admin.html${query ? `?${query}` : ""}`;
      }

      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), adminDevRoutes()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        portfolio: resolve(fileURLToPath(new URL(".", import.meta.url)), "index.html"),
        admin: resolve(fileURLToPath(new URL(".", import.meta.url)), "admin.html"),
      },
      output: {
        manualChunks: {
          'three': ['three', 'three-stdlib'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
          'gsap': ['gsap'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['gsap', 'lenis']
  }
});
