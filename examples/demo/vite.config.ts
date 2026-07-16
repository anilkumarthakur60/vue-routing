import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Point the published name at the workspace source so the demo hot-reloads
      // library changes without a rebuild.
      '@anil-labs/vue-routing': resolve(__dirname, '../../packages/vue-routing/src/index.ts'),
    },
  },
})
