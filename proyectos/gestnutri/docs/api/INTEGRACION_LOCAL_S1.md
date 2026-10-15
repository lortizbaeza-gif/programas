# Integración local de Sprint 1

Guía de Fernanda para ejecutar el backend de PR #9 con PostgreSQL y conectar
el frontend. Preparar este entorno no requiere fusionar las PR #6, #9 o #12.
La revisión cruzada de backend y docs/api queda pendiente de confirmación de
Diana con el orquestador; esta guía no constituye aprobación propia.

## 1. Preparar la rama y PostgreSQL

Usar la rama `feature/HU-01-backend-base` de PR #9 en una copia de trabajo
limpia. Ya incluye `patients/0001_initial.py` de Diana (`95ada29`): no generar
otra inicial. Mantener las PR abiertas hasta la decisión de integración.

Requisitos: Python compatible con `backend/requirements.txt`, PostgreSQL
instalado y en ejecución, y Node/npm para el frontend cuando esté disponible.
El entorno probado fue PostgreSQL 17.11, UTF8 y locale ICU `es`; ver
[evidencia](VALIDACION_POSTGRESQL.md). Si se usa otra configuración regional,
registrarla y repetir las comprobaciones de búsqueda.

Crear una base nueva de integración, sin datos reales. En `psql`, conectado
como administrador de una instancia local de pruebas:

```sql
CREATE ROLE gestnutri_local LOGIN;
\password gestnutri_local
CREATE DATABASE gestnutri_integration
  OWNER gestnutri_local ENCODING 'UTF8'
  LOCALE_PROVIDER icu ICU_LOCALE 'es' TEMPLATE template0;
```

`\password` pide la contraseña sin incluirla en el SQL. Usar el puerto de la
instancia propia; la evidencia anterior usó 55439, pero aquella instancia
temporal quedó detenida. Estos pasos no la arrancan ni reutilizan sus credenciales.
Para ejecutar `manage.py test`, el propietario necesita crear la base de
pruebas; solo en esta instancia local y aislada, el administrador puede ejecutar
`ALTER ROLE gestnutri_local CREATEDB;` y revocarlo al terminar con
`ALTER ROLE gestnutri_local NOCREATEDB;`.

## 2. Ejecutar backend en PowerShell

Desde la raíz del repositorio:

```powershell
cd backend
python -m venv .venv
& ./.venv/Scripts/python.exe -m pip install -r requirements.txt
$env:DJANGO_DEBUG = 'true'
$env:DJANGO_ALLOWED_HOSTS = 'localhost,127.0.0.1'
$env:POSTGRES_DB = 'gestnutri_integration'
$env:POSTGRES_USER = 'gestnutri_local'
$env:POSTGRES_HOST = '127.0.0.1'
$env:POSTGRES_PORT = '5432' # Cambiar si la instancia usa otro puerto.
$localPassword = Read-Host 'Contraseña de PostgreSQL' -AsSecureString
$env:POSTGRES_PASSWORD = [System.Net.NetworkCredential]::new('', $localPassword).Password
& ./.venv/Scripts/python.exe manage.py check
& ./.venv/Scripts/python.exe manage.py migrate --plan
& ./.venv/Scripts/python.exe manage.py migrate --noinput
& ./.venv/Scripts/python.exe manage.py showmigrations
& ./.venv/Scripts/python.exe manage.py makemigrations --check --dry-run
& ./.venv/Scripts/python.exe manage.py test --noinput
& ./.venv/Scripts/python.exe manage.py migrate --noinput
& ./.venv/Scripts/python.exe manage.py createsuperuser
& ./.venv/Scripts/python.exe manage.py runserver 127.0.0.1:8000
```

Detenerse si un comando falla. Esperado: migraciones aplicadas, ningún cambio
de modelo pendiente, 21 pruebas aprobadas y segunda migración sin pendientes.
Crear una cuenta local ficticia con `createsuperuser`; no hay registro público
ni panel admin configurado. Incluso los superusuarios solo ven sus pacientes.
`DJANGO_DEBUG=true` habilita configuración exclusivamente local. Django no
carga `.env.example` automáticamente. Verificar que `POSTGRES_DB` esté definido
para que esta ejecución use PostgreSQL en lugar del fallback SQLite.
Al cerrar el entorno, detener el servidor con Ctrl+C y quitar la contraseña
del proceso con `Remove-Item Env:POSTGRES_PASSWORD`.

## 3. Conectar frontend por el mismo origen

La rama actual de backend no contiene `frontend/`. Genny debe aplicar la
configuración en su rama de frontend y ejecutar los scripts de su `package.json`.
Si usa Vite, añadir este bloque a su configuración existente, conservando sus
plugins y opciones:

```javascript
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false }
  }
}
```

El navegador abre la URL de Vite y llama rutas relativas `/api/v1/...`.
No llamar directamente al puerto 8000 desde el frontend: el proxy mantiene
sesión/CSRF bajo el origen del navegador. No se requiere habilitar CORS.
`changeOrigin: false` conserva el Host del navegador para que coincida con
Origin en la validación CSRF de Django. Abrir Vite usando localhost o 127.0.0.1,
incluidos en `DJANGO_ALLOWED_HOSTS`; no usar esta configuración para exponer
el entorno a la red.
Usar siempre las barras finales de las rutas.

Ejemplo mínimo para integrar en el cliente existente:

```javascript
let csrfToken;

async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!csrfToken) throw new Error('Obtener CSRF antes de escribir');
    headers['X-CSRFToken'] = csrfToken;
  }
  const response = await fetch(`/api/v1/${path}`, {
    method, headers, credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(data?.detail || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data; // Conservar errores por campo para el formulario.
    throw error;
  }
  return data;
}

async function signIn(username, password) {
  csrfToken = (await api('auth/csrf/')).csrfToken;
  const result = await api('auth/login/', {
    method: 'POST', body: { username, password }
  });
  csrfToken = result.csrfToken; // Django rota el token al iniciar sesión.
  return result.user;
}

// Ejecutar después de signIn con una cuenta local de pruebas:
// const page = await api('patients/?page=1');
// Renderizar page.results, no asumir una lista sin paginación.
// const patient = await api('patients/', { method: 'POST', body: {
//   first_name: 'Ana María', last_name: 'Prueba', phone: '+12025550123'
// }});
// await api(`patients/${patient.id}/`, {
//   method: 'PATCH', body: { allergies: 'Dato ficticio' }
// });
// await api('auth/logout/', { method: 'POST' }); // 204, sin cuerpo JSON.
```

Al recargar, recuperar la sesión con `auth/me/` y obtener un token nuevo con
`auth/csrf/` antes de escribir. Mantener contraseñas fuera de logs y del código.
Ver [autenticación](v1-auth.md) y [pacientes](v1-patients.md) para el contrato.
No enviar `owner`, `id`, timestamps ni campos desconocidos en altas/ediciones.
No ofrecer PUT o DELETE: devuelven 405. Los opcionales admiten `''`, excepto
`birth_date`, que se limpia con `null`. Las fechas usan `AAAA-MM-DD`.

## 4. Prueba conjunta y evidencia para revisión

Con backend y frontend ejecutándose y solo datos ficticios, comprobar:

| Acción | Resultado esperado |
| --- | --- |
| Login inválido / válido | 401 / 200; conservar token CSRF rotado |
| Consultar sesión | `auth/me/` devuelve el usuario autenticado |
| Crear paciente | 201; aparece en `results` y persiste tras recargar |
| Editar mediante PATCH | 200; omitidos se conservan y opcionales se limpian |
| Nombre vacío / teléfono inválido / fecha futura | 400; errores por campo visibles |
| Buscar `ana maría` / `ana maria` | Con ICU `es`, coincide / no coincide con `Ana María` |
| Usar otra cuenta local | No lista pacientes de la primera; su UUID devuelve 404 |
| Escribir sin CSRF | 403; no crea ni modifica el paciente |
| Cerrar sesión | 204; acceso posterior sin sesión devuelve 403 |

Registrar commits de backend/frontend, versión y locale de PostgreSQL,
comandos y resultados, y evidencia del navegador sin cookies, tokens ni claves.
Fernanda entrega la guía y corrige observaciones de su área; Genny conecta su
frontend; Diana confirma los acuerdos/migración y su aceptación de la revisión
cruzada; QA y el orquestador evalúan la integración. La suite del backend no
sustituye la prueba conjunta en navegador ni las revisiones pendientes.
