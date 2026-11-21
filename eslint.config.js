const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');
module.exports = defineConfig([
  expo,
  prettier,
  {
    files: ['src/domain/**/*.ts', 'src/features/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex:
                '^(react($|/)|react-native($|[-/])|expo($|[-/])|@tanstack/|@supabase/|@maplibre/)',
              message:
                'El dominio no depende de UI, transporte ni SDK de plataforma.',
            },
            {
              regex:
                '(^|/)(application|data|presentation|infrastructure|providers|components|config|app)(/|$)|[.]generated$',
              message:
                'Importa modelos y reglas del dominio. Los DTOs y adaptadores pertenecen a capas externas.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/observations/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex:
                '^(react($|/)|react-native($|[-/])|expo($|[-/]))|(^|/)(data|presentation|infrastructure)(/|$)',
              message:
                'Los casos de uso reciben sus dependencias a través de los puertos de aplicación.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      'dist/*',
      'coverage/*',
      'test-results/**',
      'playwright-report/**',
      'src/types/api.generated.ts',
    ],
  },
]);
