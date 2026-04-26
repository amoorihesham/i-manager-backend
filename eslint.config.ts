import love from 'eslint-config-love';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ...love,

    files: ['src/**/*.{js,ts}'],

    languageOptions: {
      ...love.languageOptions,
      globals: globals.node,
    },
  },
  {
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'no-console': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/prefer-destructuring': 'warn',
      '@typescript-eslint/max-params': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unsafe-type-assertion': 'warn',
    },
  },
  eslintConfigPrettier,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
