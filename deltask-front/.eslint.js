module.exports = {
    root: true,                    // stop ESLint à la racine du projet
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    parser: '@typescript-eslint/parser', // comprendre le TS
    parserOptions: {
      ecmaVersion: 2022,                // syntaxe moderne ES
      sourceType: 'module',             // import/export
      ecmaFeatures: { jsx: true },      // JSX support
    },
    plugins: [
      '@typescript-eslint',
      'react',
      'react-hooks',
      'jsx-a11y',
      'prettier',
    ],
    extends: [
      'eslint:recommended',             // règles de base ESLint
      'plugin:@typescript-eslint/recommended', // règles TS
      'plugin:react/recommended',       // règles React
      'plugin:jsx-a11y/recommended',    // accessibilité
      'plugin:react-hooks/recommended', // règles hooks
      'plugin:prettier/recommended',    // Prettier + désactive conflits
    ],
    settings: {
      react: {
        version: 'detect',              // détecte ta version de React
      },
    },
    rules: {
      // ici tu peux surcharger ou désactiver des règles, ex :
      // 'react/prop-types': 'off',
      // '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  };
  