export const actorLabels: Record<string, string> = {
  administrador: 'Administrador',
  supervisor: 'Supervisor',
  investigador: 'Investigador',
  auditor: 'Auditor',
};
export function actorLabel(metadata: Record<string, unknown> | undefined) {
  const role = metadata?.role;
  return typeof role === 'string'
    ? (actorLabels[role] ?? 'Usuario registrado')
    : 'Usuario registrado';
}
