# Offline (AQU-49–52)

SQLite persiste respuestas validadas del catálogo público en Android/iOS.
El esquema v1 se crea con migración transaccional y consultas parametrizadas.
Las claves incluyen API, identidad y consulta normalizada; TTL de 24 horas,
máximo 200 respuestas y 2 millones de caracteres por respuesta.

Solo se recuperan datos sin conexión o ante un fallo de transporte. Nunca se
ocultan errores HTTP, respuestas inválidas o cancelaciones. Un 401/403/404
elimina la copia de esa consulta. Las pantallas indican el origen guardado y
la fecha; al reconectar vuelven a consultar la API.

La generación de caché cancela resultados tardíos al limpiar. Los cambios de
identidad y el cierre de sesión borran lo persistido. Si la limpieza falla,
se deshabilita la lectura/escritura para evitar reutilizar datos anteriores.
No se guardan tokens ni perfiles. Los endpoints actuales son públicos y no
tienen contexto de organización; este módulo no es caché de datos privados.

Web funciona sin persistencia. `pnpm run test:offline` verifica el motor SQLite
real en Node; Jest verifica la integración de pantallas y autenticación.
Consultar [alcance y validación](../offline-delivery.md).
