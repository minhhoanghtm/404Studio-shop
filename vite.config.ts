import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    ...(process.env.VITE_BACKEND_URL
      ? {
          proxy: {
            '/api': {
              target: process.env.VITE_BACKEND_URL,
              changeOrigin: true,
              secure: false,
            },
            '/uploads': {
              target: process.env.VITE_BACKEND_URL,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : {}),
  },
  // @ts-expect-error - Vitest types
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
