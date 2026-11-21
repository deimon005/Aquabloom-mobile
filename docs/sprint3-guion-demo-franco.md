# Guion de demostración móvil del Sprint 3

AQU-354. Duración estimada, 6 minutos. Preparar un APK con SHA identificado,
una cuenta de prueba y un borrador desechable. Verificar que el catálogo de
prueba carga Panguipulli antes de compartir pantalla.

| Tiempo | Acción                                                                                   | Qué mostrar                                                                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00   | Entrar desde Perfil con la cuenta de prueba.                                             | La sesión abre el flujo de observaciones del lago elegido. Ocultar correo y contraseña.                                                                     |
| 1:00   | Abrir Panguipulli, su ficha y el mapa.                                                   | Mostrar el nombre y el polígono. Si la ficha indica que no hay estaciones, mostrar ese estado.                                                              |
| 2:00   | Abrir Observaciones. Completar fecha y nota sintéticas. Denegar primero la cámara.       | Mostrar que la edición sigue intacta, leer el aviso y reintentar. Usar la escena virtual para la foto y una posición de prueba para GPS si se usa emulador. |
| 3:30   | Desconectar la red después de abrir el formulario. Guardar y volver a abrir el borrador. | Confirmar fecha, nota y estado «Guardado local · Pendiente de envío». Mostrar el retorno de conexión y el estado local del registro.                        |
| 5:00   | Abrir las estimaciones y elegir «Abrir demostración local».                              | Leer la etiqueta «Datos sintéticos», la unidad, la fecha UTC y la procedencia. Abrir el estado de un trabajo de ejemplo y señalar el aviso experimental.    |

Durante la demostración, identificar el catálogo como datos del entorno de
prueba, la foto y el GPS como entradas simuladas cuando corresponda, y la
consulta científica local como un ejemplo sintético. Una estimación de
clorofila-a no permite concluir toxicidad ni potabilidad.

Si el catálogo falla, mostrar el error y el reintento desde el APK. Luego
usar los recorridos web automatizados para mostrar una ficha, una observación
y la consulta científica con datos de prueba. Explicar que ese recorrido
web usa almacenamiento de sesión y que la comprobación de sensores y
TalkBack corresponde al APK.

Para guiar el montaje y recuperar un borrador, usar la
[guía de instalación y recuperación](./sprint3-guia-android-franco.md).
