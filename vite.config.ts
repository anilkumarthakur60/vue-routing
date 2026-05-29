import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Emit .d.ts type declarations for the published package.
    dts({
      include: ['src/lib'],
      entryRoot: 'src/lib',
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Let the demo import the library by its published name.
      '@anil-labs/vue-routing': resolve(__dirname, 'src/lib/index.ts'),
    },
  },
  build: {
    // Don't copy the demo's public/ assets into the package output.
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'VueRouting',
      fileName: 'vue-routing',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      // Don't bundle the peer deps — the consuming app provides them.
      external: ['vue', 'vue-router'],
      output: {
        exports: 'named',
        globals: { vue: 'Vue', 'vue-router': 'VueRouter' },
      },
    },
  },
})
