# Auth (AQU-17–28)

El cliente en `src/infrastructure/auth/supabase.ts` persiste la sesión con SecureStore en Android/iOS
y usa memoria en web. El formulario
de login usa Supabase; `AuthProvider` carga la sesión, escucha sus eventos y
expone `useCurrentUser`. La configuración del cliente es fija durante la vida
del proveedor; para cambiarla hay que reiniciar la app.

`ProfileScreen` muestra nombre, correo y teléfono disponibles, sin tokens ni
roles inferidos. Un visitante puede abrir el login; si Supabase no está
configurado se muestra un mensaje de indisponibilidad.

`signOutAndClearCache` usa `scope: local`, cancela las consultas y limpia las
cachés de consultas y mutaciones antes y después del cierre. Mientras ocurre,
el proveedor desmonta las pantallas para impedir nuevas consultas. Si Supabase
falla, se conserva la sesión y se ofrece reintento; nunca se informa éxito falso.
Al cambiar de cuenta o recibir SIGNED_OUT también se descartan consultas y estado
de pantallas. Los refrescos del mismo usuario conservan la caché.

Las pruebas de integración ejercitan formulario, SDK real de Supabase,
AuthProvider y perfil con transporte HTTP simulado. No requieren credenciales.

SessionLifecycle controla el refresco por AppState. RequireSession protege /profile y redirige al login; catálogo y mapa permanecen públicos. Nunca se guardan tokens en SQLite. El cierre y los
cambios de usuario limpian la caché persistente. Ver `docs/demian-session.md`
para la persistencia y `docs/jose-auth-delivery.md` para la entrega previa.
