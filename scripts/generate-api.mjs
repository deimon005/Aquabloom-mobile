import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import openapiTS, {
  astToString,
} from '../tools/openapi/node_modules/openapi-typescript/dist/index.mjs';

const [
  source,
  output = 'src/infrastructure/shared/contracts/api.generated.ts',
] = process.argv.slice(2).filter((argument) => argument !== '--');
if (!source) {
  console.error('Uso: pnpm run api:generate -- ./contracts/openapi.json');
  process.exit(1);
}
const sourcePath = resolve(source);
const relativeSource = relative(process.cwd(), sourcePath).replaceAll(
  '\\',
  '/',
);
if (relativeSource.startsWith('../') || relativeSource === '..') {
  throw new Error('El contrato OpenAPI debe estar dentro del repositorio.');
}
const outputPath = resolve(output);
const relativeOutput = relative(process.cwd(), outputPath).replaceAll(
  '\\',
  '/',
);
if (relativeOutput.startsWith('../') || relativeOutput === '..') {
  throw new Error('La salida generada debe estar dentro del repositorio.');
}
const displayedSource = `./${relativeSource}`;
const schema = JSON.parse(await readFile(sourcePath, 'utf8'));
if (typeof schema.openapi !== 'string' || !schema.paths) {
  throw new Error('El archivo no contiene un contrato OpenAPI válido.');
}
const types = await openapiTS(schema, { alphabetize: true });
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  [
    '// Este archivo es generado. No editar manualmente.',
    `// Fuente: ${displayedSource}`,
    '',
    astToString(types),
  ].join('\n'),
);
console.log(`Tipos generados desde ${source} en ${output}.`);
