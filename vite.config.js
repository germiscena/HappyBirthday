import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // Allows opening from phone via local Wi-Fi IP
    port: 5173,
    open: false
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  }
});
