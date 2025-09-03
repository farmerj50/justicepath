// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // 👈 Your Express backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // optimizeDeps: {
  //   include: ['pdfjs-dist/build/pdf.worker.js'],
  // },
});
