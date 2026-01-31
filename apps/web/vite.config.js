import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prevent duplicate React instances in monorepo
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Pre-bundle React for faster dev startup and consistent resolution
    include: ['react', 'react-dom'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
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
