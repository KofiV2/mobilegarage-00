import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow access from other devices on the network
    open: true,
    strictPort: false,
    cors: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
});
