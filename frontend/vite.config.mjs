import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  // Caddy only proxies /buchungssystem/* to this app, so emitted asset URLs must
  // carry that prefix (browser → /buchungssystem/assets/... → Caddy strips prefix
  // → express.static serves from dist/public/assets). The HTML pages are served
  // by the auth routes; the JS derives the API prefix from window.location.
  base: '/buchungssystem/',
  build: {
    outDir: path.resolve(__dirname, '../src/public'),
    emptyOutDir: false,
    manifest: false,
    rollupOptions: {
      input: {
        'booking-update': path.resolve(__dirname, 'booking-update.html'),
        'booking-create': path.resolve(__dirname, 'booking-create.html')
      }
    }
  }
});
