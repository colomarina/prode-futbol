module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:prettier/recommended', // ⬅️ Agregar esto al final
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // React
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-filename-extension': [1, { extensions: ['.jsx', '.js'] }],
    'react/function-component-definition': 'off',
    'react/jsx-no-constructed-context-values': 'off',
    'react/button-has-type': 'off',

    // Import
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/extensions': 'off',

    // General
    'no-console': 'warn',
    'no-alert': 'off',
    'no-restricted-globals': 'off',
    'no-nested-ternary': 'off',
    'no-shadow': 'off',
    'no-use-before-define': 'off',
    'radix': 'off',

    // JSX a11y
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',

    // Prettier
    'prettier/prettier': ['error', {}, { usePrettierrc: true }], // ⬅️ Usar config de .prettierrc
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx'],
        paths: ['src'],
      },
    },
  },
}
