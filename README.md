# AquaBloom Mobile

Aplicación móvil de AquaBloom Sur construida con Expo SDK 57, React Native 0.86,
Expo Router y TypeScript estricto. El Sprint 1 cubre autenticación, catálogo,
mapa, detalle de lagos, comportamiento offline y preparación Android.

## Requisitos exactos

- Git.
- Node.js 24.3.x. La versión esperada está en `.nvmrc`.
- pnpm 11.5.0. El repositorio declara esta versión en `packageManager`.
- Para desarrollo nativo: Android Studio, Android SDK 36, JDK 21 y un
  emulador o dispositivo con depuración habilitada.

## Entregas del sprint

La entrega de perfil, usuario actual y cierre de sesión (AQU-25–28) está
documentada en [Autenticación](docs/jose-auth-delivery.md). El detalle de lagos
y estaciones (AQU-37–40) está en [Catálogo](docs/catalog-delivery.md), y la
persistencia móvil (AQU-49–52) en [Caché y modo sin conexión](docs/offline-delivery.md).

La entrega de Demian y sus pendientes de aceptación están reunidos en
[Evidencia y lista de cierre](docs/demian-sprint-closeout.md).

El formulario de observación, validación y estados locales del Sprint 2
(AQU-251–254) está documentado en
[Semana 1 — Franco](docs/sprint2-week1-franco.md).

El permiso de cámara, captura única, vista previa/reemplazo y guardado de la
observación con foto y ubicación (AQU-263–266) están documentados en
[Semana 2 — Franco](docs/sprint2-week2-franco.md), incluidos los límites de
validación nativa y los adaptadores de integración.

El cierre de las pantallas científicas, navegación y accesibilidad de Franco
(AQU-275–278, AQU-290–291) se explica en la
[Guía de uso y demostración del Sprint 2](docs/guia-demostracion-sprint2-franco.md).
La demostración local es optativa y siempre está rotulada como sintética;
las rutas científicas propuestas permanecen deshabilitadas por defecto.
Las verificaciones físicas AQU-288–289 están
[preparadas pero pendientes de Android](docs/verificacion-android-franco.md).
La matriz de aceptación, las 296 pruebas y los límites de cierre están en
[Cierre de Franco — Sprint 2](docs/cierre-franco-sprint2.md).

La persistencia de borradores, recuperación, edición y eliminación con fotos
(AQU-255–258 y AQU-267–270) está documentada en
[Semanas 1 y 2 — Jose Jimenez](docs/sprint2-jose-semanas1-2.md).

## Comenzar

Comprueba las herramientas antes de instalar:

```sh
node --version
pnpm --version
git --version
```

Si pnpm no está disponible y la instalación de Node incluye Corepack:

```sh
corepack enable
corepack install --global pnpm@11.5.0
```

No mezcles gestores de paquetes. `pnpm-lock.yaml` es la única fuente de
resolución reproducible del proyecto.

## Instalación limpia

```sh
git clone https://github.com/Pamtom21/Aquabloom-mobile.git
cd Aquabloom-mobile
pnpm install --frozen-lockfile
pnpm run api:setup
```

Después crea el archivo local de entorno. En PowerShell:

```powershell
Copy-Item .env.example .env.local
```

En macOS o Linux:

```sh
cp .env.example .env.local
```

La app puede iniciar sin credenciales: mostrará un estado de configuración
pendiente en vez de fallar durante el arranque.

## Configuración pública

Completa `.env.local` sólo con valores públicos:

| Variable                               | Obligatoria | Ejemplo / propósito                                                                   |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`                  | No          | `http://10.0.2.2:8000/api/v1` para FastAPI desde el emulador Android                  |
| `EXPO_PUBLIC_SUPABASE_URL`             | En pareja   | URL HTTPS del proyecto Supabase                                                       |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | En pareja   | Clave publicable (o anon pública heredada); nunca `service_role` ni una clave privada |

Las variables `EXPO_PUBLIC_*` quedan incluidas en el bundle y no sirven para
guardar secretos. Las URL base no aceptan credenciales, query strings ni
fragmentos. Supabase debe configurarse con ambos valores o dejarse completamente
vacío. Reinicia Metro después de editar `.env.local`.

En un teléfono físico, `localhost` apunta al teléfono. Usa HTTPS o la IP LAN del
equipo que ejecuta FastAPI. En web, el backend también debe permitir el origen de
Expo mediante CORS.

El cliente agrega `/health` (AQU-59) y trata el cuerpo como `unknown` hasta
recibir OpenAPI real. `AuthProvider` sincroniza el usuario actual con Supabase y
el perfil sólo muestra datos con una sesión activa. El cierre afecta a la sesión
actual, limpia TanStack Query y descarta la caché persistente asociada. La sesión
se conserva con SecureStore en Android/iOS y el refresco sigue AppState (AQU-17);
web usa memoria. La ruta privada `/profile` vuelve al perfil después del login
(AQU-19); el catálogo sigue siendo público. Los permisos de la API deben
validarse en el servidor.

## Verificación antes de desarrollar

Ejecuta el mismo control de calidad usado por integración continua:

```sh
pnpm run check
pnpm run doctor
pnpm run export:android
```

`check` valida formato, ESLint, TypeScript y Jest. `doctor` revisa compatibilidad
con Expo SDK 57. `export:android` genera el bundle JavaScript de Android, no un
APK. Ninguno de estos pasos necesita secretos.

Para iniciar el proyecto:

```sh
pnpm run web
```

El flujo nativo usa un development build porque MapLibre contiene código nativo
y no funciona dentro de Expo Go:

```sh
pnpm run android:build
pnpm start
```

## Comandos disponibles

| Comando                                             | Resultado                                                      |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm run web`                                      | Inicia Expo para navegador                                     |
| `pnpm start`                                        | Inicia Metro para un development build                         |
| `pnpm run android`                                  | Abre el development build Android ya instalado                 |
| `pnpm run android:build`                            | Compila e instala localmente con Android SDK/JDK               |
| `pnpm run check`                                    | Ejecuta formato, lint, tipos y pruebas                         |
| `pnpm run test`                                     | Ejecuta Jest una vez                                           |
| `pnpm run test:watch`                               | Ejecuta Jest en modo interactivo                               |
| `pnpm run doctor`                                   | Comprueba dependencias y configuración Expo                    |
| `pnpm run export:android`                           | Empaqueta JavaScript y assets para Android                     |
| `pnpm run api:setup`                                | Instala el workspace aislado del generador OpenAPI             |
| `pnpm run api:generate -- ./contracts/openapi.json` | Regenera `src/types/api.generated.ts` desde el contrato fijado |

## Arquitectura

```text
src/app/             rutas y layouts de Expo Router
src/components/      primitivas visuales compartidas
src/config/          lectura y validación del entorno público
src/features/        módulos por funcionalidad y capas por responsabilidad
src/domain/          validación de identificadores compartidos
src/infrastructure/  clientes HTTP, API, Supabase y almacenamiento de sesión
src/types/           tipos generados de OpenAPI
src/providers/       QueryClient, ciclo de vida y estado global de red
src/theme/           tokens y reglas responsive
contracts/           OpenAPI versionado
scripts/             generación de código
tools/openapi/       workspace del generador con dependencias aisladas
docs/                alcance, evidencia y decisiones del sprint
```

Cada módulo puede tener `domain` (modelos y reglas), `application`
(casos de uso, puertos y consultas), `data` (adaptadores y DTOs) y
`presentation` (pantallas y componentes). Las carpetas corresponden a
responsabilidades presentes en el módulo. Las rutas de Expo Router delegan
a la presentación, y los proveedores conectan la app con infraestructura.

Para cambiar un contrato HTTP, actualizar el OpenAPI versionado y los esquemas
en `data/dto`. Las vistas y la geometría usan modelos del dominio. En
Observaciones, los casos de uso reciben los puertos de borradores y fotografías.
Las implementaciones `.web.ts` se ubican junto a sus variantes nativas para
que Metro seleccione la correcta.

### Guías por módulo

- [Observaciones](src/features/observations/README.md) describe los casos de uso, los puertos y los adaptadores de captura.
- [Catálogo](src/features/lakes/README.md) ubica los DTOs, modelos, filtros y parsers.
- [Mapa](src/features/map/README.md) explica las capas, GeoJSON y las variantes nativa y web.
- [Consulta científica](src/features/scientific/README.md) separa propuesta OpenAPI, modelos y ejemplos locales.
- [Sesión](src/features/auth/README.md) indica cómo se conectan proveedores, UI y almacenamiento de credenciales.
- [Datos sin conexión](src/features/offline/README.md) distingue caché, conectividad y borradores.

### Historial y verificación de la migración

| Commit                                                                  | Cambio                                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [e7b80a6](https://github.com/deimon005/Aquabloom-mobile/commit/e7b80a6) | Separación de Observaciones, sus puertos y adaptadores, caché y conectividad.         |
| [94cf679](https://github.com/deimon005/Aquabloom-mobile/commit/94cf679) | Modelos de dominio, DTOs de catálogo y ciencia y geometría de mapa.                   |
| [4b55c04](https://github.com/deimon005/Aquabloom-mobile/commit/4b55c04) | Capas de sesión y traslado de clientes compartidos a infraestructura.                 |
| [fc110a7](https://github.com/deimon005/Aquabloom-mobile/commit/fc110a7) | Reglas de ESLint para mantener los límites de dominio y los puertos de Observaciones. |

La [revisión integrada](https://github.com/deimon005/Aquabloom-mobile/commit/454a00c)
pasó formato, lint, TypeScript, 297 pruebas de Jest, 29 de persistencia,
2 de configuración, 4 recorridos de Playwright y el empaquetado con
`pnpm run export:android`. La [matriz del Sprint 3](docs/sprint3-franco-matriz.md)
registra lo que queda por comprobar en Android.

Cada unidad revisable se integra mediante PR enlazado a Linear y con evidencia
local. Mobile CI se ejecuta exclusivamente de forma manual (`workflow_dispatch`):
no consume GitHub Actions al enviar commits ni al abrir un PR. La validación
reproducible se realiza con `pnpm run check`, `pnpm run doctor` y
`pnpm run export:android`.

El cliente HTTP añade el prefijo configurado, cancela solicitudes y aplica un
límite de 15 segundos. React Query comparte políticas de caché y reintento. El
estado global de conectividad pausa consultas al quedar offline y presenta un
banner accesible hasta recuperar internet. Los DTOs del catálogo usan tipos generados
desde `contracts/openapi.json`.

## Android y EAS

La pestaña Mapa monta MapLibre con polígonos, estaciones y ficha inferior
([validación](docs/demian-map.md)). Web ofrece acceso al catálogo. Los perfiles
y la verificación local están en [Android y EAS](docs/demian-android.md).

Confirma el identificador `com.aquabloom.mobile` antes de distribuir. Para
compilaciones remotas, inicia sesión en EAS, vincula el proyecto del equipo y
configura allí las mismas variables públicas:

```sh
pnpm dlx eas-cli@24.8.0 init
pnpm dlx eas-cli@24.8.0 build --platform android --profile development
```

Los perfiles `development` y `preview` generan APK; `production` genera AAB. No
versiones credenciales, archivos de firma ni tokens de EAS.

## Diagnóstico rápido

- **`Unsupported engine`**: activa Node 24.3.x y repite `pnpm install`.
- **Lockfile desactualizado**: no lo ignores; sincroniza la rama y ejecuta la
  instalación con pnpm para resolver el conflicto de forma explícita.
- **Variables nuevas no aparecen**: detén Metro y vuelve a iniciarlo.
- **La API funciona en PC pero no en Android**: usa `10.0.2.2` en el emulador o
  una IP LAN accesible desde el teléfono.
- **Error CORS en web**: autoriza el origen mostrado por Expo en FastAPI.
- **Mapa ausente en Expo Go**: instala un development build; MapLibre requiere
  módulos nativos.
- **Banner “Sin conexión”**: verifica acceso real a internet; una red Wi-Fi sin
  salida también se considera offline.
- **Falla la generación OpenAPI**: ejecuta `pnpm run api:setup` y confirma que el
  contrato sea JSON OpenAPI válido antes de regenerar.

## Flujo de contribución

1. Sincroniza `main` y crea una rama enfocada.
2. Implementa una unidad revisable y agrega pruebas observables.
3. Ejecuta `pnpm run check`, `pnpm run doctor` y `pnpm run export:android`.
4. No agregues secretos ni artefactos generados fuera de los declarados.
5. Abre un pull request, enlaza los tickets de Linear y solicita revisión.

La validación local reproduce los controles del flujo manual. La evidencia del
Sprint 1 y la asignación de sus 48 tareas están en
[`docs/linear-sprint.md`](docs/linear-sprint.md).

## Estado de las integraciones

El contrato móvil de lectura está versionado en `contracts/openapi.json`,
contrastado con el código de referencia del backend y genera los tipos del
catálogo, detalle y estaciones. La referencia se consultó sin modificarla.
Falta comprobar una instancia desplegada y validar los mapas en Android.

SQLite conserva el catálogo público en Android/iOS durante 24 horas, separado
por API, usuario y consulta. El cierre de sesión y los cambios de identidad
limpian la caché. Web sigue sin persistencia SQLite. Los endpoints actuales no
tienen contexto de organización; los datos privados necesitarán un alcance
específico antes de almacenarse. No se guardan perfiles ni tokens.

El mapa, polígonos, estaciones y ficha inferior están implementados. La
[prueba E2E](e2e/README.md) recorre login, perfil, catálogo y detalle con HTTP
simulado (`pnpm run test:e2e`). Las cuentas reales y la verificación en dispositivo
siguen pendientes; las pruebas locales no certifican el servicio remoto.

## Referencias

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [NetInfo para Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/netinfo/)
- [Accesibilidad en React Native](https://reactnative.dev/docs/accessibility)
- [Supabase React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [MapLibre con Expo](https://maplibre.org/maplibre-react-native/docs/setup/expo/)
