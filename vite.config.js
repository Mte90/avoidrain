import { defineConfig } from 'vite';

export default defineConfig({
  base: '/avoidrain/',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 5173,
    open: false
  }
});
