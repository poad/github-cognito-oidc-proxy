// @ts-check

import eslint from '@eslint/js';

import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
// @ts-ignore
import importPlugin from 'eslint-plugin-import';

import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

export default tseslint.config(
  {
    ignores: [
      '*.d.ts',
      '*.{js,jsx}',
      'src/tsconfig.json',
      'src/stories',
      '*.css',
      'node_modules/**/*',
      '.next',
      'out',
      '.storybook',
      'cdk.out',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}', '{bin,lib}/*.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    extends: [
      ...tseslint.configs.recommended,
    ],
    settings: {
      'import/internal-regex': '^~/',
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    // @ts-ignore
    rules: {
      ...prettier.rules,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    extends: [
      ...tseslint.configs.recommended,
      ...compat.config(importPlugin.configs.recommended),
      ...compat.config(importPlugin.configs.typescript),
    ],
    settings: {
      'import/internal-regex': '^~/',
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
);
