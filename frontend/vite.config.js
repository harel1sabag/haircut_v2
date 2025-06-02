import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 3000,
    open: true,
    host: true,
  },
});
