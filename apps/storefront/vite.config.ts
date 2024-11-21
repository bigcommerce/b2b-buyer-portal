/* eslint-disable import/no-extraneous-dependencies */
/// <reference types="vitest" />
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';

const ENVIRONMENT_ASSET_PATH: EnvSpecificConfig<string> = {
  local: '/',
  integration: 'https://microapp-cdn.gcp.integration.zone/b2b-buyer-portal/',
  // TODO: update the following to BC cdn when migration is completed
  staging: 'https://cdn.bundleb2b.net/b2b/staging/storefront/assets/',
  production: 'https://cdn.bundleb2b.net/b2b/production/storefront/assets/',
};

// this function is called at runtime and intentionally references `window.B3`
// so that the same runtime files can dynamically choose the cdn base url location
// based on environment it is deployed to
function getAssetsAbsolutePath() {
  const environment: Environment = window.B3.setting.environment ?? Environment.Production;
  return ENVIRONMENT_ASSET_PATH[environment];
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      legacy({
        targets: ['defaults'],
      }),
      react(),
    ],
    experimental: {
      renderBuiltUrl(filename: string) {
        const isCustomBuyerPortal = env.VITE_ASSETS_ABSOLUTE_PATH !== undefined;

        const name = filename.split('assets/')[1];
        return isCustomBuyerPortal
          ? `${env.VITE_ASSETS_ABSOLUTE_PATH}${name}`
          : {
              runtime: `${getAssetsAbsolutePath()}${name}`,
            };
      },
    },
    server: {
      port: 3001,
      proxy: {
        '/bigcommerce': {
          target:
            env?.VITE_PROXY_SHOPPING_URL || 'https://msfremote-frontend-demo.mybigcommerce.com/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bigcommerce/, ''),
        },
      },
    },
    test: {
      env: {
        VITE_B2B_URL: 'https://api-b2b.bigcommerce.com',
        VITE_LOCAL_DEBUG: 'TRUE',
      },
      clearMocks: true,
      mockReset: true,
      restoreMocks: true,
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup-test-environment.ts',
      coverage: {
        provider: 'istanbul',
        cleanOnRerun: process.env.CI === 'true',
        reporter: ['text', 'html', 'clover', 'json'],
      },
      deps: {
        optimizer: {
          web: {
            include: ['react-intl'],
          },
        },
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
        tests: path.resolve(__dirname, './tests'),
      },
    },
    build: {
      minify: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          index: 'src/main.ts',
          headless: 'src/buyerPortal.ts',
        },
        output: {
          entryFileNames(info) {
            const { name } = info;
            return name.includes('headless') ? '[name].js' : '[name].[hash].js';
          },
          manualChunks: {
            reactVendor: ['react', 'react-dom'],
            intl: ['react-intl'],
            mui: ['@emotion/react', '@emotion/styled', '@mui/material'],
            muiIcon: ['@mui/icons-material'],
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
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
          }
          warn(warning);
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
  };
});
