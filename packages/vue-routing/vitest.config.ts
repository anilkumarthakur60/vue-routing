import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

// Tests run in plain Node (no SFC imports), so we deliberately avoid the vue
// plugin here. Tests import the public barrel by its published name; internals
// are reachable via the `@/` alias.
export default defineConfig({
  resolve: {
    alias: {
      '@anil-labs/vue-routing': resolve(__dirname, 'src/index.ts'),
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Measure the shipped library only  not barrels, tests, or config.
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/types/**'],
      reporter: ['text', 'html'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
