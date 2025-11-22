import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@router': path.resolve(__dirname, './src/router'),
      '@images': path.resolve(__dirname, './src/lib/assets/images'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Всё, что начинается с /stoloto, уходит на Go-сервер :8080
      '/stoloto': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // /stoloto/draws/ -> /api/draws/
        rewrite: (path) => path.replace(/^\/stoloto/, '/api'),
      },
      // Остальное API на твой основной backend :8090
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
