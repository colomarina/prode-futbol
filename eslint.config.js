// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  // El esquema generado por Supabase no se lintea: no se edita a mano, y la regla
  // de prettier lo marcaria entero.
  { ignores: ['src/types/database.ts'] },

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
  // Incluye ts/tsx para que la migración gradual no se salte estas reglas: son
  // las del proyecto (no-console, import-x, a11y) y valen igual en TypeScript.
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
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
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          paths: ['src'],
        },
      },
    },
    rules: {
      // --- React ---
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.js', '.tsx'] }],
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

  // TypeScript: parser y reglas propias, solo para lo que ya migró la fase 7.
  // Va después de las reglas compartidas porque `recommended` apaga las reglas
  // core que se pisan con las suyas (no-unused-vars, no-undef) en estos archivos.
  ...tseslint.config({
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Con `strict: false` en tsconfig todavía hay `any` implícitos dando vueltas;
      // avisar en vez de fallar deja migrar de a poco. Se sube a error junto con
      // `strict: true`, cuando no queden .jsx.
      '@typescript-eslint/no-explicit-any': 'warn',
      // El `_` como parámetro ignorado es idiomático y no es deuda.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }),

  // Tests: globals de Vitest
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/test/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
];
