import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    // Phaser 體積大且很少變動,單獨拆 chunk → 利於瀏覽器快取、消除大小警告
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/phaser/")) return "phaser";
        },
      },
    },
    chunkSizeWarningLimit: 1600,
  },
});
