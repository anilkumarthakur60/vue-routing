import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Version badge source of truth  read from the library package so a
// `changeset version` bump can't leave the landing advertising a stale release.
const { version } = JSON.parse(
  readFileSync(resolve(__dirname, '../../packages/vue-routing/package.json'), 'utf8'),
) as { version: string }

export default defineConfig({
  plugins: [vue()],
  define: {
    __PKG_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      // Point the published name at the workspace source so the demo hot-reloads
      // library changes without a rebuild.
      '@anil-labs/vue-routing': resolve(__dirname, '../../packages/vue-routing/src/index.ts'),
      // The package's internals import each other via `@/...` (see its own
      // vitest.config.ts)  mirror that alias here so those imports resolve
      // when Vite loads the source directly instead of the built bundle.
      '@': resolve(__dirname, '../../packages/vue-routing/src'),
    },
  },
})
