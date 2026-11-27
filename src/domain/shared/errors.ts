export class NetworkError extends Error {
  constructor() {
    super('No se pudo conectar con la API. Revisa tu conexión.');
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
