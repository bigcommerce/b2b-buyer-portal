/* eslint-disable import/no-extraneous-dependencies */
/// <reference types="vitest" />
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'

interface AssetsAbsolutePathProps {
  [key: string]: string
}

const assetsAbsolutePath: AssetsAbsolutePathProps = {
  staging: 'https://cdn.bundleb2b.net/b2b/staging/storefront/assets/',
  production: 'https://cdn.bundleb2b.net/b2b/production/storefront/assets/',
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [
      legacy({
        targets: ['defaults'],
      }),
      react(),
    ],
    experimental: {
      renderBuiltUrl(
        filename: string,
        {
          type,
        }: {
          type: 'public' | 'asset'
        }
      ) {
        const isCustom = env.VITE_ASSETS_ABSOLUTE_PATH !== undefined

        if (type === 'asset') {
          const name = filename.split('assets/')[1]
          return isCustom
            ? `${env.VITE_ASSETS_ABSOLUTE_PATH}${name}`
            : `${assetsAbsolutePath[mode]}${name}`
        }

        return undefined
      },
    },
    server: {
      port: 3001,
      proxy: {
        '/bigcommerce': {
          target:
            env?.VITE_PROXY_SHOPPING_URL ||
            'https://msfremote-frontend-demo.mybigcommerce.com/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bigcommerce/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'html', 'clover', 'json'],
      },
      deps: {
        inline: ['react-intl'],
      },
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      minify: true,
      rollupOptions: {
        input: {
          index: 'src/main.ts',
          headless: 'src/buyerPortal.ts',
        },
        output: {
          entryFileNames(info) {
            const { name } = info
            return name.includes('headless') ? '[name].js' : '[name].[hash].js'
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return
          }
          warn(warning)
        },
        manualChunks: {
          intl: ['react-intl'],
          redux: ['react-redux'],
          dateFns: ['date-fns'],
          lang: ['@b3/lang'],
          pdfobject: ['pdfobject'],
          resizable: ['react-resizable'],
          pdf: ['react-pdf'],
          toolkit: ['@reduxjs/toolkit'],
          form: ['react-hook-form'],
          router: ['react-router-dom'],
          lodashEs: ['lodash-es'],
          dropzone: ['react-dropzone'],
          draggable: ['react-draggable'],
          eCache: ['@emotion/cache'],
          eReact: ['@emotion/react'],
          eStyled: ['@emotion/styled'],
        },
        plugins: env.VITE_VISUALIZER === '1' && [
          visualizer({
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ],
      },
    },
  }
})
