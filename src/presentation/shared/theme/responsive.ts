import { tokens } from './tokens';

export const responsiveBreakpoints = {
  narrow: 360,
  wide: 768,
  largeText: 1.4,
} as const;

export type ResponsiveLayout = {
  columns: 1 | 2;
  horizontalPadding: number;
  isCompact: boolean;
  isWide: boolean;
  stackActions: boolean;
};

export function resolveResponsiveLayout(
  width: number,
  fontScale = 1,
): ResponsiveLayout {
  const usesLargeText = fontScale >= responsiveBreakpoints.largeText;
  const isCompact = width < responsiveBreakpoints.narrow || usesLargeText;
  const isWide = width >= responsiveBreakpoints.wide && !usesLargeText;

  return {
    columns: isWide ? 2 : 1,
    horizontalPadding: isCompact
      ? tokens.spacing.md
      : isWide
        ? tokens.spacing.xl
        : tokens.spacing.lg,
    isCompact,
    isWide,
    stackActions: isCompact,
  };
}
