import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

// Vite is used for the demo dev server (`npm run dev`) and the demo build
// (vite.demo.config.ts). The LIBRARY is built with tsup (see tsup.config.ts).
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Let the demo import the library by its published name.
      '@anil-labs/vue-routing': resolve(__dirname, 'src/lib/index.ts'),
    },
  },
})
