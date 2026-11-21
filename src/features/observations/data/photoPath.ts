// Hex segments cannot inject slashes or dot segments into a managed directory.
export function scopeSegment(value: string) {
  if (!value || value.length > 512)
    throw new Error('Ámbito de fotografía no válido.');
  return Array.from(value)
    .map((character) => character.codePointAt(0)!.toString(16).padStart(6, '0'))
    .join('');
}
