// @ts-check

import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import react from 'eslint-plugin-react';
import globals from 'globals';

// import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import flowtypePlugin from 'eslint-plugin-flowtype';
import pluginPromise from 'eslint-plugin-promise';

import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

import { includeIgnoreFile } from '@eslint/compat';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      '*.d.ts',
      'src/tsconfig.json',
      '*.css',
      'node_modules/**/*',
      '.next',
      'out',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  // ...compat.config({
  //   extends: ['next/core-web-vitals'],
  // }),
  // @ts-expect-error ignore type error
  pluginPromise.configs['flat/recommended'],
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      formComponents: ['Form'],
      linkComponents: [
        { name: 'Link', linkAttribute: 'to' },
        { name: 'NavLink', linkAttribute: 'to' },
      ],
      'import/internal-regex': '^~/',
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
    plugins: {
      '@stylistic': stylistic,
      react,
      'jsx-a11y': jsxA11yPlugin,
      // // @ts-expect-error ignore type error
      // '@next/next': nextPlugin,
      'flow-type': flowtypePlugin,
    },
    extends: [
      ...compat.config(jsxA11yPlugin.configs.recommended),
    ],
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single'],
    },
  },
);
