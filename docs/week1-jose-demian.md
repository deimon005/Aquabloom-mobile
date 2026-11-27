# Semana 1 — José y Demian

Revisión del 8 de septiembre de 2026. Alcance: AQU-5, AQU-6, AQU-7, AQU-8,
AQU-13, AQU-14, AQU-15 y AQU-16 del proyecto móvil. Linear identifica este bloque
como Semana 1 (3–9 de septiembre).

La base de estas ocho tareas ya estaba en `main` al comenzar esta revisión
(`f2d248d`). Esta entrega corrige los problemas encontrados, amplía la evidencia
automática y prepara el conjunto para revisión del equipo.

## Implementación y evidencia

| Tarea                           | Responsable | Implementación                                                                                                                                                              | Verificación                                                                                                             |
| ------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| AQU-5 — Expo y TypeScript       | Demian      | Expo SDK 57, React Native 0.86, TypeScript estricto y entrada Expo Router                                                                                                   | Instalación limpia con Node 24.3.0, typecheck, arranque web y exportación Android                                        |
| AQU-6 — Variables públicas      | Demian      | `.env.example` y `src/infrastructure/shared/config/env.ts`; acceso directo a variables Expo, normalización de espacios, validación de URL y configuración Supabase completa | Pruebas de inicio sin variables, URL inválida, credenciales en URL, parámetros, fragmentos y configuración parcial       |
| AQU-7 — Cliente Supabase        | Demian      | `src/infrastructure/auth/supabase.ts`; cliente único cuando existe configuración, sesión en memoria                                                                         | Pruebas de arranque sin configuración y creación del cliente real con valores de ejemplo; sesión inicial vacía           |
| AQU-8 — Cliente HTTP tipado     | Demian      | `src/infrastructure/shared/http.ts`; prefijo API, cabeceras, resultado genérico, cancelación y límite de 15 segundos                                                        | Pruebas de URL, token, HTTP 401, HTTP 204, cancelación, timeout con señal del llamador, fallo de red y JSON inválido     |
| AQU-13 — ESLint y Prettier      | José        | Configuraciones y scripts existentes `lint`, `format:check` y `check`                                                                                                       | Formato y lint aprobados                                                                                                 |
| AQU-14 — Estructura de carpetas | José        | `src/app`, `features`, `lib`, `config`, `providers`, `components` y `theme`                                                                                                 | La pantalla health usa las capas compartidas; typecheck y bundle resuelven sus importaciones                             |
| AQU-15 — Consultar health       | José        | `src/presentation/health/HealthScreen.tsx` consulta `/health` y presenta carga, error, reintento y éxito                                                                    | Prueba de pantalla con cliente HTTP: 503, reintento y 200 JSON; inicio web sin variables muestra configuración pendiente |
| AQU-16 — CI en pull requests    | José        | `.github/workflows/ci.yml`, evento `pull_request`, instalación reproducible, formato, lint, tipos, pruebas, compatibilidad Expo y bundle Android                            | Los mismos comandos se verifican localmente; consultar el resultado remoto en la pestaña Checks del PR                   |

## Correcciones de esta entrega

- El cliente HTTP conserva el límite de 15 segundos aunque TanStack Query
  proporcione su propia señal de cancelación. Antes esa señal desactivaba el
  timeout. El temporizador y el listener se limpian al terminar la solicitud.
- Los errores de red, timeout y JSON inválido muestran mensajes comprensibles
  sin presentar el cuerpo de error del servidor.
- Las variables vacías o con espacios se normalizan. Una configuración parcial
  de Supabase o una URL base con credenciales, query o fragmento se detectan
  antes de construir los clientes.

## Validación reproducible

```sh
npm ci
npm run api:setup
npm run check
npx expo install --check
npm run export:android
npm run web
```

Resultado local: formato, ESLint y TypeScript aprobados; 5 suites y 23 pruebas
aprobadas. Dependencias compatibles con Expo. La pantalla inicial web arranca
sin variables y muestra la configuración pendiente. La exportación Android
genera el bundle JavaScript; no equivale a generar o instalar un APK.

## Aceptación pendiente del equipo

- Revisar y aprobar el pull request antes de cerrar las tareas en Linear.
- Configurar la URL FastAPI real con prefijo `/api/v1` y comprobar `/health`
  desde el entorno del equipo. Las pruebas automáticas usan respuestas
  controladas; no certifican disponibilidad del backend real.
- Configurar la URL y clave pública reales de Supabase para verificar acceso
  al proyecto del equipo. Las pruebas no hacen solicitudes a un proyecto real.

La persistencia de sesión y el flujo de autenticación corresponden a la Semana 2.
No se incluyen credenciales reales ni se cambia el estado de las tareas en Linear.
