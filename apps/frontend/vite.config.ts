// @ts-nocheck
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server:
    process.env.NODE_ENV === 'development'
      ? {
          proxy: {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setupTests.ts'],
    css: true,
    globals: true,
  },
});
