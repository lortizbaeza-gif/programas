# Backend S1-BE

Base Django 5.2 LTS / DRF. Rama `feature/HU-01-backend-base`, derivada de `develop`.

## Ejecutar localmente (PowerShell)

```powershell
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
$env:DJANGO_DEBUG = 'true'
$env:DJANGO_SECRET_KEY = 'cambiar-por-un-secreto-local-aleatorio'
.venv/Scripts/python.exe manage.py migrate
.venv/Scripts/python.exe manage.py createsuperuser
.venv/Scripts/python.exe manage.py runserver
```

`.env.example` documenta variables; Django no carga ese archivo automáticamente.
SQLite se permite solo en desarrollo. Para producción configurar PostgreSQL,
secreto, hosts y HTTPS. No hay registro público de profesionales.

## Validar

```powershell
.venv/Scripts/python.exe manage.py check
.venv/Scripts/python.exe manage.py test
.venv/Scripts/python.exe manage.py makemigrations --check --dry-run
```

Se incorporó la migración inicial de Diana (PR #12) sin modificarla. Las pruebas
normales usan migraciones reales. PostgreSQL 17.11 / UTF-8 / ICU es pasó las 21
pruebas; ver `docs/api/VALIDACION_POSTGRESQL.md`. CI corresponde a S1-QA.

## Integración pendiente

Guía de arranque con PostgreSQL, proxy del frontend, sesión/CSRF y prueba
conjunta: [Integración local S1](../docs/api/INTEGRACION_LOCAL_S1.md).

Se incorporaron la propuesta de Diana `81f2b36` y su migración `95ada29`.
El modelo, migración y endpoints fueron verificados en PostgreSQL local.
Faltan CI, revisión de QA/orquestador y revisión humana antes de integrar.
Ver `docs/api/v1-patients.md` y `docs/api/S1-BE-status.md`.
