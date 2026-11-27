// Este archivo es generado. No editar manualmente.
// Fuente: ./contracts/scientific.proposal.openapi.json

export interface paths {
  '/lakes/{lake_id}/estimates': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['listLakeEstimates'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/scientific/jobs/{job_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['getScientificJob'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    EstimateListResponse: {
      items: components['schemas']['EstimatePoint'][];
    };
    EstimatePoint: {
      dataset_id?: string | null;
      dataset_version?: string | null;
      /** Format: uuid */
      id: string;
      /** Format: uuid */
      lake_id: string;
      latitude?: number | null;
      longitude?: number | null;
      model_id?: string | null;
      model_version?: string | null;
      /** Format: date-time */
      observed_at: string;
      point_id: string;
      scene_id?: string | null;
      status: string;
      unit: string;
      value: number;
      variable: string;
      warnings: string[];
    };
    ScientificJob: {
      error_message?: string | null;
      /** Format: uuid */
      id: string;
      progress?: number | null;
      /** @enum {string} */
      status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
      /** Format: date-time */
      updated_at: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  listLakeEstimates: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        lake_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Resultados por punto del lago (propuesta) */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['EstimateListResponse'];
        };
      };
      /** @description Sesión no válida */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Sin permiso de consulta */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Lago inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Servicio no disponible */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  getScientificJob: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        job_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Estado de un trabajo existente (propuesta) */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ScientificJob'];
        };
      };
      /** @description Sesión no válida */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Sin permiso de consulta */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Trabajo inexistente */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Servicio no disponible */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
