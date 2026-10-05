import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode || 'development', process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(
        env.GOOGLE_MAPS_PLATFORM_KEY ||
        env.GOOGLE_MAPS_API_KEY ||
        env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
        env.VITE_GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_PLATFORM_KEY ||
        ''
      ),
      'process.env.GOOGLE_MAPS_API_KEY': JSON.stringify(
        env.GOOGLE_MAPS_PLATFORM_KEY ||
        env.GOOGLE_MAPS_API_KEY ||
        env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
        env.VITE_GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        ''
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
