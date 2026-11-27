import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  checkArchitecture,
  dependencyViolation,
  moduleReferences,
} from './check-architecture.mjs';

test('rejects SDKs and adapters in inner layers, including type-only dependencies', () => {
  const source = 'src/application/lakes/example.ts';
  for (const dependency of [
    'react',
    'expo-sqlite',
    '@supabase/supabase-js',
    '../../infrastructure/lakes/catalogApi',
    '../../composition/lakes',
  ]) {
    assert.ok(dependencyViolation(source, dependency), dependency);
  }
  assert.ok(
    dependencyViolation(
      'src/domain/lakes/example.ts',
      '../../application/lakes/catalogQueries',
    ),
  );
  assert.equal(dependencyViolation(source, '../../domain/lakes/types'), null);
  assert.equal(
    dependencyViolation('src/domain/map/example.ts', 'geojson'),
    null,
  );
});

test('rejects outward adapter dependencies and direct presentation access to adapters', () => {
  assert.ok(
    dependencyViolation(
      'src/infrastructure/auth/example.ts',
      '../../composition/auth',
    ),
  );
  assert.ok(
    dependencyViolation(
      'src/infrastructure/auth/example.ts',
      '../../presentation/auth/AuthProvider',
    ),
  );
  assert.ok(
    dependencyViolation(
      'src/presentation/auth/example.ts',
      '../../infrastructure/auth/supabase',
    ),
  );
  assert.ok(
    dependencyViolation(
      'src/presentation/shared/components/example.ts',
      '../../../domain/lakes/types',
    ),
  );
  assert.ok(
    dependencyViolation(
      'src/presentation/auth/example.ts',
      '../../composition/auth',
    ),
  );
  assert.equal(
    dependencyViolation(
      'src/presentation/auth/example.ts',
      '../shared/services/AppServicesProvider',
    ),
    null,
  );
});

test('examines imports, exports, import types, dynamic imports and requires', () => {
  assert.deepEqual(
    moduleReferences(
      `
    import type { T } from './type';
    export { value } from './value';
    type Other = import('./other').T;
    const lazy = import('./lazy');
    const common = require('./common');
    // import './ignored';
  `,
      'example.ts',
    ),
    ['./type', './value', './other', './lazy', './common'],
  );
});

test('the production source respects the architecture boundaries', async () => {
  const { violations, count } = await checkArchitecture();
  assert.ok(count > 0);
  assert.deepEqual(violations, []);
});

test('only the root route can import the composition root', () => {
  assert.equal(
    dependencyViolation('src/app/_layout.tsx', '../composition/AppProviders'),
    null,
  );
  assert.ok(dependencyViolation('src/app/login.tsx', '../composition/auth'));
  assert.ok(
    dependencyViolation('src/app/login.tsx', '../infrastructure/auth/supabase'),
  );
  assert.equal(
    dependencyViolation('src/app/login.tsx', '../presentation/auth/LoginForm'),
    null,
  );
});
