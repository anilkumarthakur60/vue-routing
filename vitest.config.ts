import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

// Tests run in plain Node (no SFC imports), so we deliberately avoid the vue /
// dts plugins here — that also sidesteps the vite-version type clash between
// rolldown-vite (vite 8) and vitest's bundled vite.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
