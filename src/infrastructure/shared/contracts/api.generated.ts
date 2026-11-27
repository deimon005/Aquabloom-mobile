// Este archivo es generado. No editar manualmente.
// Fuente: ./contracts/openapi.json

export interface paths {
    "/lakes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar lagos */
        get: operations["listLakes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/lakes/{lake_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getLakeDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/lakes/{lake_id}/stations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listLakeStations"];
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
        Lake: {
            description?: string | null;
            /** Format: uuid */
            id: string;
            name: string;
            region: string;
            status: string;
        };
        LakeDetail: {
            /** Format: date-time */
            created_at: string;
            description?: string | null;
            geom: {
                [key: string]: unknown;
            };
            /** Format: uuid */
            id: string;
            name: string;
            region: string;
            status: string;
            /** Format: date-time */
            updated_at: string;
        };
        LakeListResponse: {
            items: components["schemas"]["Lake"][];
            page: number;
            page_size: number;
            total: number;
        };
        Station: {
            code: string;
            /** Format: date-time */
            created_at: string;
            description?: string | null;
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            lake_id: string;
            name: string;
            point: unknown;
            status: string;
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
    listLakes: {
        parameters: {
            query?: {
                limit?: number;
                page?: number;
                region?: string;
                status?: string;
                text?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página de lagos */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LakeListResponse"];
                };
            };
            /** @description Filtros inválidos */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getLakeDetail: {
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
            /** @description Respuesta del catálogo */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LakeDetail"];
                };
            };
            /** @description Lago inexistente */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Parámetros inválidos */
            422: {
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
    listLakeStations: {
        parameters: {
            query?: {
                status?: string;
            };
            header?: never;
            path: {
                lake_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Respuesta del catálogo */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Station"][];
                };
            };
            /** @description Lago inexistente */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Parámetros inválidos */
            422: {
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
