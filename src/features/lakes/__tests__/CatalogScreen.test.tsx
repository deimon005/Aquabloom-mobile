import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import { CatalogScreen } from '../CatalogScreen';
import { useLakes } from '../useLakes';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../useLakes', () => ({ useLakes: jest.fn() }));

const mockedUseLakes = jest.mocked(useLakes);
const refetch = jest.fn();

function queryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: { items: [], page: 1, page_size: 20, total: 0 },
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch,
    ...overrides,
  } as unknown as ReturnType<typeof useLakes>;
}

describe('CatalogScreen', () => {
  beforeEach(() => {
    refetch.mockReset();
    mockedUseLakes.mockReturnValue(queryResult());
  });

  it('presenta el estado de carga inicial', async () => {
    mockedUseLakes.mockReturnValue(queryResult({ isPending: true }));
    const view = await render(<CatalogScreen />);

    expect(view.getByText('Cargando catálogo de lagos…')).toBeTruthy();
    expect(view.getByRole('progressbar', { busy: true })).toBeTruthy();
    expect(
      view.queryByText('No hay lagos disponibles en el catálogo.'),
    ).toBeNull();
  });

  it('permite reintentar un error sin filtrar detalles internos', async () => {
    mockedUseLakes.mockReturnValue(
      queryResult({ isError: true, error: new Error('private server trace') }),
    );
    const view = await render(<CatalogScreen />);

    expect(view.getByText(/No pudimos cargar el catálogo/)).toBeTruthy();
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.queryByText('private server trace')).toBeNull();
    await fireEvent.press(view.getByRole('button', { name: 'Reintentar' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('diferencia un catálogo vacío de una búsqueda sin coincidencias', async () => {
    const view = await render(<CatalogScreen />);
    expect(
      view.getByText('No hay lagos disponibles en el catálogo.'),
    ).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText('Nombre del lago'),
      'Panguipulli',
    );
    await fireEvent.press(
      view.getByRole('button', { name: 'Aplicar filtros' }),
    );
    expect(view.getByText(/No encontramos lagos/)).toBeTruthy();
    expect(view.getByRole('button', { name: 'Limpiar' })).toBeEnabled();
  });

  it('no presenta un resultado anterior o vacío como respuesta a los filtros nuevos', async () => {
    mockedUseLakes.mockReturnValue(
      queryResult({ isPlaceholderData: true, isFetching: true }),
    );
    const view = await render(<CatalogScreen />);
    expect(
      view.getByText('Buscando lagos con los nuevos filtros…'),
    ).toBeTruthy();
    expect(
      view.queryByText('No hay lagos disponibles en el catálogo.'),
    ).toBeNull();
  });

  it('aplica filtros y permite limpiarlos', async () => {
    const view = await render(<CatalogScreen />);

    await fireEvent.changeText(view.getByLabelText('Nombre del lago'), 'Ranco');
    await fireEvent.changeText(view.getByLabelText('Región'), 'Los Ríos');
    await fireEvent.press(
      view.getByRole('button', { name: 'Aplicar filtros' }),
    );

    expect(mockedUseLakes).toHaveBeenLastCalledWith({
      search: 'Ranco',
      region: 'Los Ríos',
      page: 1,
      page_size: 20,
    });
    await fireEvent.press(view.getByRole('button', { name: 'Limpiar' }));
    expect(mockedUseLakes).toHaveBeenLastCalledWith({ page: 1, page_size: 20 });
  });

  it('muestra resultados accesibles y navega a la ficha del lago', async () => {
    mockedUseLakes.mockReturnValue(
      queryResult({
        data: {
          items: [
            {
              id: '08c06bab-c038-461c-b3d2-a19e580e2a28',
              name: 'Lago Villarrica',
              region: 'La Araucanía',
              status: 'vigilancia',
              description: 'Monitoreo activo de floraciones algales.',
            },
          ],
          page: 1,
          page_size: 20,
          total: 1,
        },
      }),
    );
    const view = await render(<CatalogScreen />);

    expect(view.getByText('1 lago')).toBeTruthy();
    expect(view.getByText('Lago Villarrica')).toBeTruthy();
    await fireEvent.press(
      view.getByRole('button', {
        name: 'Ver detalle de Lago Villarrica, La Araucanía',
      }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/lakes/[id]',
      params: { id: '08c06bab-c038-461c-b3d2-a19e580e2a28' },
    });
  });
});
