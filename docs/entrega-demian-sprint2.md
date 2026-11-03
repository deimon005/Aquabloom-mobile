# Entrega móvil de Demian · Sprint 2

| Tarea             | Evidencia y estado                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| AQU-247           | [Propuesta de contrato móvil](scientific-mobile-contract.md) con campos y ausencias. Falta acuerdo con Web/API.                               |
| AQU-248           | Tipos de estimaciones y trabajos generados desde el OpenAPI de propuesta. El catálogo conserva su contrato.                                   |
| AQU-262           | El mapa de captura muestra la posición y ajusta el encuadre para incluirla junto al lago.                                                     |
| AQU-271           | Consulta por lago con el QueryClient y adaptador compartidos. La ruta requiere confirmación en staging.                                       |
| AQU-272           | Seguimiento de trabajos remotos activos cada cinco segundos, con un límite de 30 actualizaciones y detención en estados terminales o errores. |
| AQU-273 y AQU-274 | Marcadores puntuales con estilo propio y ficha del resultado identificado por el marcador seleccionado. Se omiten coordenadas inválidas.      |
| AQU-284 y AQU-285 | Pendientes de Gateway y cuentas autorizada y restringida de staging. AQU-241 sigue en Backlog.                                                |
| AQU-286           | Mapa y ficha comprobables con respuestas de prueba. Pendiente contraste de un punto real con el Gateway.                                      |
| AQU-287           | El perfil preview define un APK interno. Pendiente construir, instalar y registrar un APK de este incremento.                                 |

## Verificación con el Gateway y Android

1. Confirmar las rutas de estimaciones y trabajos con Web/API. Configurar
   `EXPO_PUBLIC_API_URL` para el Gateway autorizado, las variables de sesión
   de staging y `EXPO_PUBLIC_SCIENTIFIC_API_ENABLED=true` en ese entorno.
2. Consultar un lago y un trabajo con una cuenta autorizada. Registrar fecha,
   estado HTTP y el identificador del resultado o trabajo, sin incluir tokens.
   Repetir con la cuenta restringida y comprobar el rechazo del servidor y que
   la pantalla no muestre resultados ni puntos de la consulta rechazada.
3. Para un punto real, contrastar UUID, latitud, longitud, valor y unidad entre
   respuesta, marcador y ficha. Repetir con lago vacío y resultado sin
   coordenadas.
4. Con acceso al proyecto EAS del equipo, ejecutar
   `eas build --platform android --profile preview`, instalar el APK y
   registrar ID del build, versión, dispositivo y resultado de los recorridos.

Se adaptaron al cliente actual los cambios de las ramas de Demian para mapa,
ficha y captura. Las demostraciones permanecen separadas del Gateway.
