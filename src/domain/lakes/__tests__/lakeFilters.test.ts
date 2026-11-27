import {
  defaultLakeFilters,
  normalizeLakeFilters,
  serializeLakeFilters,
} from '../lakeFilters';

describe('filtros del catálogo de lagos', () => {
  it('normaliza texto, paginación y límite del contrato', () => {
    expect(
      normalizeLakeFilters({
        search: '  Villarrica  ',
        region: '  Araucanía ',
        page: -2,
        page_size: 500,
      }),
    ).toEqual({
      search: 'Villarrica',
      region: 'Araucanía',
      page: 1,
      page_size: 100,
    });
  });

  it('aplica valores predeterminados y omite filtros vacíos', () => {
    expect(normalizeLakeFilters({ search: ' ', region: '' })).toEqual({
      ...defaultLakeFilters,
      search: undefined,
      region: undefined,
    });
  });

  it('serializa todos los filtros con un orden estable', () => {
    expect(
      serializeLakeFilters({
        search: 'Lago Azul',
        region: 'Los Ríos',
        page: 2,
        page_size: 10,
      }),
    ).toBe('text=Lago+Azul&region=Los+R%C3%ADos&page=2&limit=10');
  });
});
