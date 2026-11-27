const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');
module.exports = defineConfig([
  expo,
  prettier,
  {
    ignores: [
      'dist/*',
      'coverage/*',
      'test-results/**',
      'playwright-report/**',
      'src/infrastructure/shared/contracts/api.generated.ts',
    ],
  },
]);
