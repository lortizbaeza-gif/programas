# Flujo de Sprint 1

Inicio → lista/búsqueda paginada → alta → expediente → edición → expediente. Cancelar y Volver regresan a la lista. Salir invoca logout en modo API. La navegación usa estado React, sin definir endpoints adicionales.

Dos modos seleccionados al iniciar Vite:
- mock (predeterminado): adaptador local, escenarios visuales de error/vacío/no encontrado, cambios en memoria.
- api: adaptador según PR #9, formulario username/password, cookies de sesión y CSRF. No muestra selector de escenarios ni agrega pacientes ficticios automáticamente.

En modo API se recupera la sesión con auth/me/ y se obtiene CSRF con auth/csrf/. Login rota el token. Logout admite 204. La lista renderiza results, count y controles de página, y envía search (máximo 150 caracteres). Alta usa POST, edición PATCH; el adaptador excluye ID, fechas de auditoría y owner. Errores por campo se presentan en el formulario, 404 muestra no encontrado y errores de sesión regresan al acceso. Un error CSRF se muestra para revisión, no se reintenta una escritura automáticamente.

Las pantallas incluyen carga, error, vacío, guardado y éxito. La definición central de campos vive en patients.js; el adaptador de red en api-client.js y la selección de modo en data-client.js. No hay PUT, DELETE ni funcionalidades fuera de Sprint 1.

Fuente: guía y contratos v1-auth.md/v1-patients.md del commit ef9356f de backend. Es integración local contra el contrato implementado, todavía pendiente de revisión del equipo. Mantener las PR abiertas; no se declara el issue completo ni aprobada la integración.
