// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Required for PDF.js to load worker correctly
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.js'],
  },
});
