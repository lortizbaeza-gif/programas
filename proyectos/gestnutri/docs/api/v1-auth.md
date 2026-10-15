# Contrato API v1: autenticación (propuesta para revisión)

Estado: implementado y probado localmente; pendiente de revisión del orquestador
y propietarios. No equivale a contrato aprobado del equipo.

Base: `/api/v1/auth/`. JSON y sesiones Django mediante cookie `sessionid` HttpOnly.
Frontend debe usar el mismo origen (proxy `/api` en Vite durante desarrollo).
No se habilitan orígenes CORS indiscriminados.

| Método | Ruta | Entrada | Respuesta |
| --- | --- | --- | --- |
| GET | `csrf/` | — | 200 `{ "csrfToken": "..." }` y cookie CSRF |
| POST | `login/` | `{ "username": "...", "password": "..." }` | 200 `{ "user": { "id": 1, "username": "...", "first_name": "...", "last_name": "..." }, "csrfToken": "..." }` |
| GET | `me/` | Sesión | 200 con objeto de usuario |
| POST | `logout/` | Sesión y CSRF | 204 sin cuerpo |

Enviar `Content-Type: application/json`, cookies (`credentials: 'include'`) y
`X-CSRFToken` en los POST. Consultar CSRF antes del login y usar el token nuevo
devuelto tras login porque Django lo rota. Contraseñas nunca se devuelven.

Errores: 400 JSON/campos inválidos, 401 credenciales inválidas (también usuarios
inactivos), 403 sesión requerida o CSRF inválido, 405 método no permitido,
415 contenido de login distinto de JSON. Errores de API incluyen `detail`.
El login no revela si la cuenta existe. Las cuentas se crean administrativamente.

Antes de despliegue, establecer límites de intentos en el proxy/gateway y
verificar HTTPS, cookies y PostgreSQL en el entorno objetivo.

Referencias de implementación:
[autenticación DRF](https://www.django-rest-framework.org/api-guide/authentication/),
[CSRF y AJAX](https://www.django-rest-framework.org/topics/ajax-csrf-cors/).
