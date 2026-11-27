# Cuentas locales provisionales de desarrollo

## Estado y activación

Implementado y activado para pruebas locales el 25 de noviembre de 2026.
Se configuró `EXPO_PUBLIC_AUTH_PROVIDER=local` en `.env.local`, conservando los
valores de Supabase. No se cambiaron dependencias ni archivos de bloqueo.
API y Metro están iniciados; el emulador reconstruyó el paquete Android y mostró
el catálogo de cuatro lagos desde SQLite. No se ha publicado.

`EXPO_PUBLIC_AUTH_PROVIDER` acepta `supabase` (valor predeterminado) o `local`.
El valor es público y nunca contiene credenciales. `local` exige `__DEV__` y una
`EXPO_PUBLIC_API_URL` HTTP/HTTPS completa que termine en `/api/v1`; no se añade ese
prefijo por segunda vez. Una configuración inválida deja autenticación y API sin
configurar, sin recurrir a otro proveedor. En producción se rechaza `local`, aunque
existan variables de Supabase. Las variables originales de Supabase se conservan.
Con proveedor local no se instancia el cliente Supabase.

Los formularios de acceso/registro y el perfil indican **Entorno local de pruebas**.
Las cuentas locales no representan cuentas de Supabase y no se migran entre ambos.
Usar datos ficticios y contraseñas únicas de pruebas, sin reutilizar credenciales.
HTTP queda limitado al entorno de desarrollo; este flujo no habilita publicación.

## Arquitectura y contrato

- Dominio: contratos de autenticación y registro; registro nuevo de 15 a 256
  caracteres de contraseña. El acceso conserva compatibilidad con claves anteriores.
- Infraestructura: `createLocalAuthClient` recibe URL, transporte, almacenamiento
  y reloj inyectables. Valida respuestas, coordina sesiones y no imprime tokens ni
  refleja errores/cuerpos del servidor.
- Composición: selecciona una única instancia para iniciar sesión, registrar,
  consultar la sesión y obtener el Bearer de las solicitudes a la API.
- Presentación: recibe servicios mediante `AppServicesProvider`; no importa SDK,
  configuración o adaptadores de infraestructura.

Endpoints bajo `{apiUrl}/local-auth`: `POST /register` recibe
`{email,password,full_name}`; `POST /login` recibe `{email,password}`. Ambos devuelven
la sesión directamente. `GET /session` devuelve usuario, vencimiento y tipo Bearer
sin token; el cliente conserva el token original. `POST /logout` revoca la sesión
y responde 204. Correo normalizado a minúsculas y nombre sin espacios exteriores.
No se ofrecen roles elegibles, administración ni recuperación alternativa.

Solo se aceptan identificadores UUID, tokens opacos base64url de 32 a 512 caracteres
(sin formato JWT), tipo `bearer`, vencimiento válido de hasta 1.200 segundos y
metadatos del servidor `role: usuario`, `auth_provider: local`. El cliente no decide
permisos privados: el servidor debe autorizarlos en cada solicitud.

## Persistencia, vencimiento y revocación

En Android/iOS se utiliza exclusivamente el adaptador existente de Expo SecureStore,
con accesibilidad `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. La clave
`aquabloom.local-auth.session.v1` es independiente de Supabase. El registro conserva
versión, proveedor, URL base exacta, token y vencimiento; no contraseña ni perfil.
Cambiar host, puerto o URL base invalida el registro antes de enviar solicitudes.
No existe alternativa de almacenamiento en texto si falla SecureStore.

En web el token vive solo en la memoria de esa instancia. No se usa `localStorage`,
`sessionStorage`, cookies ni persistencia de navegador. Recargar exige nuevo acceso.

`getSession` exige validación remota incluso después de reiniciar. Revocación,
respuesta inválida, fallo de red o vencimiento descartan la sesión local. La API
nunca obtiene un token de una sesión que no pudo validarse. Los cambios de estado
notifican suscriptores y admiten `unsubscribe`. Las operaciones se serializan para
que una respuesta tardía no restaure una sesión cerrada.

La sesión vence a los 20 minutos absolutos del servidor. El cliente comprueba la
fecha antes de cada uso y al regresar al primer plano en móvil. No hay renovación
ni ampliación de plazo: `startAutoRefresh` valida, `stopAutoRefresh` no lo extiende.
No se añade un temporizador continuo de interfaz: una pantalla inactiva puede
mantener el nombre visible hasta la siguiente comprobación; el servidor sigue
rechazando operaciones cuando vence la sesión.

Cerrar sesión intenta revocar en servidor y elimina la credencial local incluso si
falla la red. Un error indica que no se confirmó el cierre completo; permanece
visible también en el perfil sin sesión. Si no se confirmó revocación, la sesión
remota puede seguir vigente hasta su vencimiento original. Si falla la persistencia
de un acceso, se intenta revocar la sesión recién emitida y se rechaza el acceso.

## Verificación y pendientes

- TypeScript principal y pruebas E2E: comprobación estática aprobada, sin ejecutar navegador.
- Jest focal: 16 suites y 111 pruebas aprobadas. Cubren adaptador, persistencia SecureStore/reinicio, memoria web, aislamiento
  por API/proveedor, datos inválidos, límites de registro, expiración, revocación,
  errores seguros, concurrencia y composición. También regresiones de acceso,
  registro, perfil y autenticación Supabase existente.
- Reglas de arquitectura: 5 pruebas aprobadas y 136 archivos de producción sin
  dependencias prohibidas. ESLint y formato comprobados en los archivos intervenidos.

Se verificaron por HTTP real alta, acceso, consulta y cierre con la API SQLite;
un token revocado recibió401. La cuenta sintética se retiró. Pruebas aisladas del
servidor verifican vencimiento y límites persistentes, además del catálogo.
La creación de una cuenta personal debe realizarla el propietario en la app.
La implementación del servidor y custodia de la base están documentadas en
`D:/Integracion/aquabloom-sprint2-local/apps/api/local_backend/SEGURIDAD_ARQUITECTURA.md`.
Estas comprobaciones locales no constituyen una publicación ni validación de
controles de producción.

Documentación oficial consultada antes de implementar:
[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) y
[SecureStore SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/).

## Arranque Android cuando falla la ventana del emulador

El 25 de noviembre de 2026 se verificó el arranque conservando el AVD y sus datos:
`emulator -avd Medium_Phone_API_37.0 -no-window -gpu swiftshader -feature -Vulkan -no-snapshot -cores 4 -memory 2048`.
La ventana Qt fallaba antes de iniciar Android; el mismo teléfono inició sin esa
ventana y se muestra/controla mediante scrcpy 5.0.1 de su distribución oficial,
con SHA-256 comprobado. No se reinstaló la app ni se borraron datos del AVD.

El visor se limita a `--serial=emulator-5554`, con `--no-audio`,
`--no-clipboard-autosync`, `--hwdec=disabled` y `--render-driver=direct3d`.
La herramienta está en `%LOCALAPPDATA%/AquaBloom/tools/scrcpy-win64-v5.0.1`.
La API continúa en 127.0.0.1:8000 y Metro en 127.0.0.1:8081; Android utiliza
10.0.2.2 para acceder al anfitrión. Esta alternativa no habilita acceso remoto ni
cambia autenticación, permisos, secretos o configuración de red.
