import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import tseslint from 'typescript-eslint'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/demo-dist/**',
      '**/node_modules/**',
      '**/docs/**',
      '**/*.config.ts',
      'eslint.config.js',
    ],
  },

  pluginVue.configs['flat/essential'],

  // Type-aware, strict rules. This is what bans `any`, unsafe assignments,
  // floating promises, etc. across the codebase.
  vueTsConfigs.strictTypeChecked,
  vueTsConfigs.stylisticTypeChecked,

  {
    name: 'app/type-checked-parser',
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // No `any`, ever.
      '@typescript-eslint/no-explicit-any': 'error',
      // These strict rules conflict with intentional, vue-router-mirroring API
      // design (void-returning guards) and ergonomic public generics.
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
    },
  },

  // The demo is an example app that mixes `.vue` SFCs (which the tsc-based
  // project service can't fully type). Lint it without type information to
  // avoid untyped-`.vue`-import noise — `no-explicit-any` still applies.
  {
    name: 'app/demo-untyped',
    files: ['demo/**/*.{ts,vue}'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  skipFormatting,
)
