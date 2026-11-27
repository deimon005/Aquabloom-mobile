import { resolveResponsiveLayout, responsiveBreakpoints } from '../responsive';

describe('resolveResponsiveLayout', () => {
  it('apila controles y conserva una columna en teléfonos angostos', () => {
    expect(
      resolveResponsiveLayout(responsiveBreakpoints.narrow - 1),
    ).toMatchObject({
      columns: 1,
      isCompact: true,
      isWide: false,
      stackActions: true,
    });
  });

  it('aprovecha dos columnas en tablet sin aumentar la densidad táctil', () => {
    expect(resolveResponsiveLayout(responsiveBreakpoints.wide)).toMatchObject({
      columns: 2,
      isCompact: false,
      isWide: true,
      stackActions: false,
    });
  });

  it('prioriza texto grande por sobre el ancho disponible', () => {
    expect(
      resolveResponsiveLayout(1024, responsiveBreakpoints.largeText),
    ).toMatchObject({
      columns: 1,
      isCompact: true,
      isWide: false,
      stackActions: true,
    });
  });
});
