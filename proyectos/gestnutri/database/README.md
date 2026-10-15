# Persistencia de pacientes — Sprint 1

Responsable: Diana. Issue #2. **Entrega documental inicial; migración pendiente de acuerdos con Fernanda.**

## Documentos para iniciar la coordinación

- [Contrato de datos y ejemplos](../docs/data/CONTRATO_PACIENTE_S1.md).
- [Diccionario de Paciente](../docs/data/DICCIONARIO_PACIENTE.md).
- [Diagrama y relaciones pendientes](../docs/data/ERD_S1.md).

PostgreSQL es el destino de persistencia. La versión soportada y la configuración de conexión las publicará backend. Usar una base de desarrollo desechable, UTF-8 y timestamps con zona horaria; API propone UTC. Guardar credenciales en variables de entorno locales, nunca en Git ni en evidencias. No incluir volcados, bases locales ni datos reales.

## Secuencia de implementación

1. Fernanda confirma en #2 aplicación, ruta de migraciones, ID, validaciones, versiones y política de acceso. El orquestador revisa el contrato.
2. Acordar la incorporación del modelo en el área backend. Esta entrega no modifica `backend/` ni crea una aplicación paralela.
3. Diana genera la migración inicial desde el modelo acordado con la versión Django del proyecto, únicamente en la ruta confirmada. No mantener un esquema SQL independiente de Django.
4. Ejecutar el comando de migraciones publicado por Fernanda sobre una base PostgreSQL nueva. No ejecutar sobre producción ni borrar bases existentes.
5. Verificar restricciones, persistencia y coincidencia modelo/migración. Registrar evidencia sin secretos en la PR.

## Comandos de referencia, todavía no ejecutables aquí

Estos ejemplos solo aplican si Fernanda confirma `backend/manage.py` y el entorno activado; no son comandos verificados del repositorio actual:

```text
python backend/manage.py check
python backend/manage.py makemigrations --check --dry-run
python backend/manage.py migrate --plan
python backend/manage.py migrate
python backend/manage.py showmigrations
```

La generación de la inicial deberá especificar el nombre real de aplicación confirmado por Fernanda. Después de aplicar la migración, repetir `makemigrations --check --dry-run` y verificar los casos del contrato. Un segundo `migrate` no debe proponer trabajo pendiente. No confundir estos pasos con pruebas ya realizadas.

## Datos ficticios

Los ejemplos JSON del contrato son documentación; **no son fixtures de Django ni datos cargados**. No se aporta un comando de carga mientras no exista aplicación/endpoint aprobado. Si se requiere una fixture después, contendrá exclusivamente pacientes ficticios y usará la etiqueta real del modelo confirmada por backend.

## Estado comprobado de esta entrega

- Se entregan diccionario, ERD, contrato propuesto y guía de persistencia.
- No se crea esquema, modelo ejecutable, migración ni cambios en endpoints, permisos, frontend o CI.
- No se afirma que `migrate` o `makemigrations --check` pasen: falta la aplicación Django.
- La Issue #2 permanece abierta hasta completar migración, pruebas, revisión del orquestador y aprobación humana.
