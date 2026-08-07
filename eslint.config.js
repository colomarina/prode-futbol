// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // ESLint core recomendado
  js.configs.recommended,

  // React recomendado + JSX runtime (React 17+)
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],

  // Import-x recomendado (reemplazo moderno de eslint-plugin-import)
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.react,

  // Accesibilidad (opcional, puedes quitarlo si no lo usas)
  jsxA11y.flatConfigs.recommended,

  // React Hooks (versión 5+ para ESLint 9)
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },

  // React Refresh (solo para Vite/Webpack)
  {
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Prettier (siempre al final para sobrescribir reglas de estilo)
  prettierConfig,
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    },
  },

  // TU CONFIGURACIÓN PERSONALIZADA (conserva tus reglas)
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import-x/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
          paths: ['src'],
        },
      },
    },
    rules: {
      // --- React ---
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.js'] }],
      'react/function-component-definition': 'off',
      'react/jsx-no-constructed-context-values': 'off',
      'react/button-has-type': 'off',

      // --- Import ---
      'import-x/prefer-default-export': 'off',
      'import-x/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'import-x/extensions': 'off',

      // --- General ---
      'no-console': 'warn',
      'no-alert': 'off',
      'no-restricted-globals': 'off',
      'no-nested-ternary': 'off',
      'no-shadow': 'off',
      'no-use-before-define': 'off',
      radix: 'off',

      // --- JSX a11y ---
      // En 'warn' a proposito: son deuda conocida que se salda en la fase de
      // design system (FormField) y a11y. Apagarlas escondia el problema.
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },

  // Tests: globals de Vitest
  {
    files: ['**/*.{test,spec}.{js,jsx}', 'src/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
];
