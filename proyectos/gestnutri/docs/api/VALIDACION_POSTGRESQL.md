# Validación backend en PostgreSQL

Fecha local: 6 de octubre de 2026 (America/Mexico_City).
Base de código: backend `3028853` y migración de Diana `95ada29` / PR #12.
La migración se incorporó sin modificaciones. Se ampliaron las pruebas de los
cinco CHECK y se agregó un caso de protección al eliminar al propietario.

## Entorno real comprobado

- PostgreSQL 17.11, Windows x86-64, distribución portátil EDB.
- Django 5.2.18, DRF 3.16.1, psycopg 3.3.6; dependencias fijadas.
- Base nueva y desechable `gestnutri_review`, solo datos ficticios de pruebas.
- Conexión `127.0.0.1:55439`; autenticación SCRAM-SHA-256.
- Encoding UTF8, proveedor ICU (`datlocprovider=i`), locale `es`, versión
  de collation `153.14.37`; valores libc LC_COLLATE=C y LC_CTYPE=C.
- Contraseña aleatoria exclusiva de esta prueba, no publicada ni versionada.
- Instancia detenida después de validar; no se instaló un servicio de Windows.

Fuentes del runtime:
[PostgreSQL para Windows](https://www.postgresql.org/download/windows/) y
[binarios de EDB](https://www.enterprisedb.com/download-postgresql-binaries).

## Resultados

| Comprobación | Resultado |
| --- | --- |
| `manage.py migrate --plan` | Incluye `patients.0001_initial` |
| `manage.py migrate --noinput` | Todas las migraciones aplicadas correctamente |
| `manage.py showmigrations` | Auth, contenttypes, patients y sessions aplicadas |
| `manage.py makemigrations --check --dry-run` | No changes detected |
| `manage.py test --noinput` con settings normales | 21 pruebas, OK; base temporal PostgreSQL |
| Segundo `manage.py migrate --noinput` | No migrations to apply |
| Introspección `pg_constraint` | Cinco CHECK, PK UUID y FK a auth_user presentes |
| CHECK mediante escrituras de modelo sin validación del serializer | Rechaza nombres vacíos/espacios, teléfono inválido y textos sobre 2000 |
| Eliminación del propietario con pacientes | Django lanza ProtectedError |
| Búsqueda: `Ana María` frente a `ana maría` | Coincide usando UPPER/LIKE, como icontains |
| Búsqueda: `Ana María` frente a `ana maria` | No coincide: no se eliminan acentos |

La suite también cubre sesiones/CSRF, validaciones de contrato, alta, lectura,
PATCH, duplicados permitidos, búsqueda/paginación y aislamiento entre usuarios.
Los resultados regionales se limitan a este entorno y a los casos ejecutados;
una collation diferente requiere repetirlos.

Metadatos y restricciones exactas en `postgresql-evidence.json`.

## Repetir en una base desechable

Configurar POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST y
POSTGRES_PORT mediante entorno, además de DJANGO_DEBUG=true para ejecución
local. No publicar credenciales. El usuario de pruebas debe poder crear la base
temporal que utiliza Django; ese privilegio no es una recomendación para producción.

Desde `backend/`, con dependencias instaladas, repetir los seis comandos de la
tabla. No usar settings que deshabiliten migraciones ni SQLite como sustituto.

## Estado de revisión

Backend aporta evidencia para que QA reevalúe S1-BE-05 y el orquestador revise
las dependencias. No es una aprobación independiente, no modifica la matriz QA,
no demuestra CI ni conexión de frontend y no autoriza fusión por sí sola.
