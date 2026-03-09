module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',          // Parser TypeScript
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },               // Support JSX/TSX
  },
  settings: {
    react: { version: 'detect' },              // Détecte la version de React automatiquement
  },
  extends: [
    'eslint:recommended',                      // Recommandations JS
    'plugin:react/recommended',                // Recommandations React
    'plugin:@typescript-eslint/recommended',   // Recommandations TS
    'plugin:react-hooks/recommended'           // Bonnes pratiques Hooks
  ],
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',         // React 18 n’a plus besoin d’import React
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Optionnel pour TSX
    'react/prop-types': 'off',                 // On utilise TS pour typage des props
    'no-console': 'warn',                       // Warning console.log
  },
};
