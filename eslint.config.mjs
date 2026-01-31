import js from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    ignores: ['src/commons/utils/main.js', 'tests/**', 'src/**/*.test.js'],
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
    files: ['src/**/*.js'],
    ignores: ['src/version/*.js'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.jest,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      semi: ['error', 'never'],
      'react/jsx-no-target-blank': 'off',
      quotes: ['error', 'single'],
      'no-const-assign': 'error',
      'no-unused-vars': 'error',
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
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
]
