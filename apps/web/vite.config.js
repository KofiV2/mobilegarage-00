import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prevent duplicate React instances in monorepo
    dedupe: ['react', 'react-dom'],
    alias: {
      '@3on/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  optimizeDeps: {
    // Pre-bundle React for faster dev startup and consistent resolution
    include: ['react', 'react-dom'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Firebase into its own chunk (largest dependency)
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // Split React ecosystem
          react: ['react', 'react-dom', 'react-router-dom'],
          // Split i18n
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: true,
    strictPort: false,
    cors: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
});
