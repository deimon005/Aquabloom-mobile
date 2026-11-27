import { tokens } from '../tokens';

function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((part) => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
it.each([
  ['text', 'background'],
  ['muted', 'background'],
  ['text', 'surface'],
  ['primary', 'surface'],
  ['error', 'background'],
] as const)(
  'keeps normal enabled text %s on %s at a contrast ratio of at least 4.5',
  (foreground, background) => {
    const values = [
      luminance(tokens.colors[foreground]),
      luminance(tokens.colors[background]),
    ];
    expect(
      (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05),
    ).toBeGreaterThanOrEqual(4.5);
  },
);
