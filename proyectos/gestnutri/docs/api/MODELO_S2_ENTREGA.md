# Modelo único followup — entrega a datos

El modelo real está en backend/followup/models.py y la app está registrada en
config.settings. Contiene Consultation, Measurement y ManualNote conforme a
SEGUIMIENTO_S2.md: UUID, propiedad derivada de Patient.owner, PROTECT,
una medición por consulta, notas históricas, peso decimal y restricciones.
No se modifica Patient ni su inicial. No se entregan endpoints S2 todavía.

Alex asume temporalmente la generación de la migración por coordinación del
equipo. Desde el SHA exacto publicado en PR #24 debe generar únicamente
backend/followup/migrations/0001_initial.py, con dependencia patients.0001_initial.
La clase followup.fields.WeightField es parte del commit y debe conservarse:
rechaza conversiones de bool/float a peso exacto. Los validadores referenciados
por la migración están en followup.models y deben mantenerse importables.

No hay carpeta migrations en esta entrega: Django trata followup como app sin
migrar hasta que datos genere la inicial. No usar migrate --run-syncdb para
validar persistencia S2 ni tomar tablas creadas por el test runner como evidencia
de migración. Fernanda no ejecutó makemigrations ni creó una inicial paralela.

Verificación: manage.py check sin incidencias; 25 pruebas normales aprobadas
en SQLite (21 de regresión S1 + 4 de modelo S2 sin acceso a base de datos).
Las cuatro nuevas comprueban fechas, escala/rango/finitud de peso, notas y
cardinalidad/PROTECT/ausencia de owner duplicado. No prueban CHECK de PostgreSQL.

Pendiente tras recibir la migración: revisar SQL/PK/FK/UNIQUE/CHECK en PostgreSQL
nuevo, aplicar/repetir migrate y comprobar makemigrations --check --dry-run;
implementar y probar API, permisos por propietario, concurrencia y evolución.
Los validadores/full_clean no se ejecutan automáticamente al guardar: serializers
y restricciones de persistencia son necesarios. La precisión adicional puede
redondearse por numeric en escrituras directas; debe rechazarse antes en API.

La PR permanece en borrador hasta integrar coordinadamente esos entregables,
con revisión independiente. No se declara Sprint 2 terminado.
