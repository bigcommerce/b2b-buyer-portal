import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bigcommerce': {
        target: 'https://store-rtmh8fqr05.mybigcommerce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bigcommerce/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
