/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults'],
    }),
    react(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/bigcommerce': {
        target: 'https://store-rtmh8fqr05.mybigcommerce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bigcommerce/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
