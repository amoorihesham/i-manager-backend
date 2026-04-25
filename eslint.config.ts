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
  { rules: { '@typescript-eslint/no-magic-numbers': 'off', 'no-console': 'off' } },
  eslintConfigPrettier,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
