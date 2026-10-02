import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'

const sharedRules = {
  ...reactPlugin.configs.recommended.rules,
  semi: ['error', 'never'],
  'react/jsx-no-target-blank': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  quotes: ['error', 'single'],
  'no-const-assign': 'error',
  'prefer-const': 'error',
  'no-new-object': 'error',
  'quote-props': ['error', 'as-needed'],
  'no-array-constructor': 'error',
  'no-eval': 'error',
  'no-trailing-spaces': 'error',
  'max-params': ['error', 4],
  'max-depth': ['error', 3],
  'eol-last': ['error', 'always'],
  'testing-library/no-unnecessary-act': 'off',
  'import/named': 'error',
  ...reactHooksPlugin.configs.recommended.rules,
}

const sharedSettings = {
  react: {
    version: 'detect',
  },
  'import/resolver': {
    typescript: {
      project: './tsconfig.json',
    },
  },
}

const sharedLanguageOptions = {
  ecmaVersion: 2020,
  sourceType: 'module',
  globals: {
    ...globals.browser,
    ...globals.es2020,
    ...globals.jest,
    Buffer: 'readonly',
    process: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
}

export default [
  js.configs.recommended,
  {
    ignores: [
      'src/commons/utils/main.js',
      'tests/**',
      'src/**/*.test.js',
      'src/services/Crypto/Mintlayer/@mintlayerlib-js/**',
      'src/tests/mock/wasmCrypro/**',
    ],
  },
  {
    files: ['*.js', '*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['src/version/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['src/tests/mock/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['src/**/*.js'],
    ignores: ['src/version/*.js'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },
    languageOptions: sharedLanguageOptions,
    settings: sharedSettings,
    rules: {
      ...sharedRules,
      'no-unused-vars': 'error',
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
    },
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tseslint.parser,
    },
    settings: sharedSettings,
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
]
