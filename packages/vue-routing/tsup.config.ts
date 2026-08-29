import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  // Dual build: ESM (.js) + CJS (.cjs), each with a matching declaration
  // (.d.ts / .d.cts)  tsup handles the dual-package types correctly.
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: false,
  // Peer deps are provided by the consuming app  never bundle them.
  external: ['vue', 'vue-router'],
  // Use a tsconfig that resolves the `@/` alias in declaration output too.
  tsconfig: 'tsconfig.tsup.json',
})
