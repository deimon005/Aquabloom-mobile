import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const portable = (path) => path.replaceAll('\\', '/');
const layerOf = (path) =>
  path.match(/^src\/(domain|application|infrastructure|presentation)\//)?.[1];

export function dependencyViolation(source, dependency) {
  const layer = layerOf(source);
  if (!dependency.startsWith('.')) {
    if (
      (layer === 'domain' || layer === 'application') &&
      !['zod', 'geojson'].includes(dependency)
    ) {
      return 'Las capas internas no pueden depender de frameworks ni SDK.';
    }
    return null;
  }
  const target = portable(resolve(root, dirname(source), dependency));
  const local = portable(relative(root, target));
  const targetLayer = layerOf(local);
  if (layer === 'domain' && targetLayer !== 'domain') {
    return 'El dominio solo puede importar dominio.';
  }
  if (
    layer === 'application' &&
    !['domain', 'application'].includes(targetLayer)
  ) {
    return 'Los casos de uso solo pueden importar dominio o aplicación.';
  }
  if (
    layer === 'infrastructure' &&
    (!targetLayer || targetLayer === 'presentation')
  ) {
    return 'Los adaptadores no pueden importar presentación, rutas ni composición.';
  }
  if (
    layer === 'presentation' &&
    (targetLayer === 'infrastructure' ||
      local.startsWith('src/app/') ||
      local.startsWith('src/composition/'))
  ) {
    return 'La presentación recibe contratos mediante AppServicesProvider; no importa infraestructura, composición ni rutas.';
  }
  if (
    /^src\/presentation\/shared\/(components|theme)\//.test(source) &&
    !local.startsWith('src/presentation/shared/')
  ) {
    return 'Los elementos compartidos no pueden depender de funcionalidades.';
  }
  if (
    source.startsWith('src/app/') &&
    (targetLayer === 'infrastructure' ||
      (local.startsWith('src/composition/') &&
        !(
          source === 'src/app/_layout.tsx' &&
          local === 'src/composition/AppProviders'
        )))
  ) {
    return 'Solo el layout raíz conecta la composición; las rutas consumen presentación.';
  }
  return null;
}

export function moduleReferences(source, filename) {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const refs = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      refs.push(node.moduleSpecifier.text);
    }
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      refs.push(node.argument.literal.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require')) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      refs.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return refs;
}

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (
      /\.tsx?$/.test(entry.name) &&
      !entry.name.endsWith('.generated.ts')
    )
      result.push(path);
  }
  return result;
}

export async function checkArchitecture() {
  const violations = [];
  const sources = await files(resolve(root, 'src'));
  for (const path of sources) {
    const source = portable(relative(root, path));
    if (
      !/^src\/(domain|application|infrastructure|presentation|composition|app)\//.test(
        source,
      )
    ) {
      violations.push(
        `${source}: archivo fuera de las carpetas de arquitectura.`,
      );
    }
    for (const dependency of moduleReferences(
      await readFile(path, 'utf8'),
      path,
    )) {
      const reason = dependencyViolation(source, dependency);
      if (reason) violations.push(`${source} -> ${dependency}: ${reason}`);
    }
  }
  return { violations, count: sources.length };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const { violations, count } = await checkArchitecture();
  if (violations.length) {
    console.error(violations.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      `Arquitectura verificada: ${count} archivos, sin dependencias prohibidas.`,
    );
}
