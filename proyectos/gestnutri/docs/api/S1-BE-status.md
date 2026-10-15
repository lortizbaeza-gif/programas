# Estado S1-BE / Issue #3

Backend preparado en PR #9, con la propuesta de datos de PR #6 y la migración
inicial de Diana de PR #12 (95ada29), incorporada sin cambios. Los acuerdos de
propiedad y modelo se registraron en la conversación de PR #9.

Implementado: Django/DRF, autenticación por sesión y CSRF, modelo Patient,
validaciones estrictas, alta/lista/búsqueda/consulta/PATCH y aislamiento por
profesional. Contratos API versionados en este directorio.

## Evidencia actual

Se aplicó la migración en una base PostgreSQL 17.11 nueva y desechable, UTF8,
ICU es. Pasaron las 21 pruebas normales sobre esquema migrado. Los cinco CHECK,
PK y FK fueron comprobados, no hay cambios de modelo pendientes y un segundo
migrate no tiene operaciones. Mayúsculas coinciden en el caso probado; acentos
se conservan. Ver VALIDACION_POSTGRESQL.md y postgresql-evidence.json.

Se retiró config.test_settings: las pruebas actuales utilizan migraciones reales.
La instancia temporal se detuvo al finalizar. No hay cambios en la migración
ni en las áreas QA/frontend/datos por parte de backend.

## Pendiente

QA debe reevaluar S1-BE-05 con esta evidencia y el orquestador revisar integración
y dependencias. Faltan CI, revisión humana y comprobación de frontend con API.
No se declara Sprint terminado ni se fusionó ninguna PR. La aprobación externa
no se sustituye por las pruebas locales de backend.
