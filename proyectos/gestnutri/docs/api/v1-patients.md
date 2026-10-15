# API v1 de pacientes — borrador implementado

Basado en la propuesta de Diana 81f2b36 en docs/data/CONTRATO_PACIENTE_S1.md.
Acuerdos registrados en PR #9. La migración de PR #12 se incorporó y validó en PostgreSQL; la revisión de integración sigue pendiente.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | /api/v1/patients/ | Lista paginada del profesional autenticado |
| POST | /api/v1/patients/ | Alta, 201 con objeto |
| GET | /api/v1/patients/{uuid}/ | Expediente básico, 200 |
| PATCH | /api/v1/patients/{uuid}/ | Edición parcial, 200 |

Sesión obligatoria; POST/PATCH requieren CSRF. PUT y DELETE devuelven 405.
El objeto contiene exactamente los diez campos canónicos de Diana.

Lista: {"count":1,"next":null,"previous":null,"results":[objeto]}.
page empieza en 1, page_size predeterminado 20 y máximo 100. Orden estable por
apellidos, nombre y UUID. search (máximo 150 caracteres) busca subcadenas en
nombre, apellidos, teléfono y correo, siempre dentro de pacientes del usuario.
La comparación de mayúsculas/acentos depende del motor y collation; no se
promete equivalencia de acentos.

Alta exige first_name, last_name y phone. Opcionales usan cadena vacía salvo
birth_date, que usa null. PATCH conserva omitidos y permite limpiar opcionales.
Textos requieren strings, recortan extremos y respetan límites del diccionario.
Fecha exige AAAA-MM-DD real y no futura según fecha local del servidor (UTC).
Contactos pueden repetirse. ID/timestamps/campos desconocidos se rechazan.

Errores: 400 listas de mensajes por campo o non_field_errors; 403 sesión/CSRF;
404 paciente inexistente o ajeno; 405 método no permitido. Mensajes no son
identificadores estables. Validaciones fallidas no producen escrituras parciales.

## Coordinación para Diana

Aplicación patients; modelo patients.Patient; tabla patients_patient.
Modelo real: backend/patients/models.py. Migración inicial prevista:
backend/patients/migrations/0001_initial.py, entregada por Diana en PR #12 (95ada29).

Backend propone owner: FK obligatoria a settings.AUTH_USER_MODEL (User Django,
PK entero), relación uno-a-muchos y on_delete=PROTECT. Se asigna desde sesión,
no se acepta en entrada ni se devuelve. Staff/superusuarios tampoco ven
pacientes ajenos en esta API. Esta relación fue confirmada en la conversación de PR #9.
No se añaden consultas, mediciones ni campos clínicos adicionales.

Versiones exactas en backend/requirements.txt: Django 5.2.18, DRF 3.16.1,
psycopg 3.3.6. PostgreSQL 17.11, UTF8 y locale ICU es es la
configuración probada. Conexión mediante variables POSTGRES_*.

La inicial ya existe: no generar otra. Aplicar y comprobar desde backend:

```text
python manage.py migrate --plan
python manage.py migrate
python manage.py showmigrations
python manage.py makemigrations --check --dry-run
python manage.py test
```

Pasaron las 21 pruebas normales en PostgreSQL 17.11 con migraciones reales.
Los cinco CHECK, PK y FK se comprobaron. Para los casos probados, Ana María
coincide con ana maría, pero no con ana maria; no se eliminan acentos.
Ver VALIDACION_POSTGRESQL.md. CI, revisión QA/orquestador y revisión humana
siguen pendientes; las pruebas locales no autorizan la fusión por sí solas.
