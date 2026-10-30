import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        dashboard: resolve(import.meta.dirname, "hemkontroll_3d_fungerande.html"),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/screen-ws':{target:'ws://127.0.0.1:8123',ws:true},
      '/app-api':{target:'http://127.0.0.1:8123'},
      '/downloads':{target:'http://127.0.0.1:8123'},
      '/dev-api': { target: 'http://127.0.0.1:8123' },
      '/dev-ws': { target: 'ws://127.0.0.1:8123', ws: true, rewrite: () => '/simulator/ws' },
      '/workspace-api': { target: 'http://127.0.0.1:8123' },
      '/connection-api': { target: 'http://127.0.0.1:8123', rewrite: path => path.replace('/connection-api', '/bridge/api') },
      '/connection-ws': { target: 'ws://127.0.0.1:8123', ws: true, rewrite: () => '/bridge/ws' },
      "/ha-api": {
        target: "http://127.0.0.1:8123",
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/ha-api/, "/api"),
        headers: { Authorization: "Bearer hemkontroll-local-dev" },
      },
      "/ha-ws": {
        target: "ws://127.0.0.1:8123",
        ws: true,
        rewrite: () => "/api/websocket",
      },
    },
  },
});
