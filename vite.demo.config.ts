import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

// Standalone SPA build of the demo app (NOT the library). The default
// vite.config.ts is a library build; this one bundles index.html → demo/main.ts
// into `demo-dist/` for static hosting (e.g. Vercel).
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // The demo consumes the library by its published name.
      '@anil-labs/vue-routing': resolve(__dirname, 'src/lib/index.ts'),
    },
  },
  build: {
    outDir: 'demo-dist',
    emptyOutDir: true,
  },
})
