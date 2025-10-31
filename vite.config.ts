import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // Use IPv4 to avoid ::1 (IPv6) ECONNREFUSED
        changeOrigin: true,
      },
      '/ml': {
        target: 'http://127.0.0.1:5000', // Flask sentiment API
        changeOrigin: true,
      },
    }
  }
});