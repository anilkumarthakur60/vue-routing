import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/lib/index.ts'],
  // Dual build: ESM (.js) + CJS (.cjs), each with a matching declaration
  // (.d.ts / .d.cts) — tsup handles the dual-package types correctly.
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  // No sourcemaps in the published package — keeps the tarball lean (source is
  // on GitHub). Flip to true if you want to ship them.
  sourcemap: false,
  // Peer deps are provided by the consuming app — never bundle them.
  external: ['vue', 'vue-router'],
  // Use the app tsconfig so the `@/` path alias resolves in both the JS and
  // declaration outputs.
  tsconfig: 'tsconfig.tsup.json',
})
