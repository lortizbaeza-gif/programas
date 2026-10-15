# Contrato de datos de Paciente — propuesta v1

Entrega inicial de Diana para desbloquear la coordinación con Fernanda (Issue #3) y Genny (Issue #4). Relacionado con #2; **no cierra #2**.

Estado: preparado para revisión, sin aprobación del orquestador ni de backend. No hay endpoints implementados por esta entrega. Las rutas, autenticación, paginación y búsqueda las documentará Fernanda en `docs/api/`; este documento define el objeto y las reglas propuestas, no el envoltorio de listas ni rutas definitivas.

## Fuente de verdad

[Diccionario de campos](DICCIONARIO_PACIENTE.md) y [modelo lógico](ERD_S1.md). Los nombres externos e internos propuestos coinciden. No usar `phoneNumber`, `nombre`, `birthDate` u otras variantes para esos campos.

## Ejemplos ficticios

Alta mínima propuesta:

```json
{"first_name":"Ana María","last_name":"Ejemplo Prueba","phone":"+12025550123"}
```

Objeto de respuesta propuesto (datos completamente ficticios):

```json
{
  "id": "f58b634c-daf9-4b8c-9c23-a25f9c837fd2",
  "first_name": "Ana María",
  "last_name": "Ejemplo Prueba",
  "phone": "+12025550123",
  "email": "ana.ejemplo@example.com",
  "birth_date": "1990-04-15",
  "allergies": "Alergia ficticia a cacahuate",
  "restrictions": "Restricción ficticia de lactosa",
  "created_at": "2026-10-06T18:00:00Z",
  "updated_at": "2026-10-06T18:00:00Z"
}
```

Edición parcial que elimina datos opcionales sin alterar los demás:

```json
{"email":"","birth_date":null,"restrictions":""}
```

## Semántica propuesta para backend y frontend

- Crear exige `first_name`, `last_name` y `phone`; la respuesta incluye los diez campos, también los opcionales vacíos.
- PATCH valida solo los campos enviados y conserva los omitidos. Si backend ofrece PUT, exigirá todos los campos editables; los opcionales también deben enviarse explícitamente. No implementar PUT con semántica ambigua.
- `id`, `created_at` y `updated_at` son de solo lectura: rechazar su envío en solicitudes de escritura. Rechazar también nombres de campos desconocidos para detectar contratos incompatibles.
- Propuesta de errores de validación: HTTP 400 con un objeto de listas de mensajes por campo; errores generales bajo `non_field_errors`. Ejemplo: `{"phone":["Usa formato internacional, por ejemplo +12025550123."]}`. Fernanda debe confirmar forma y política; las frases no son identificadores estables.
- Las fechas no incluyen hora; timestamps se serializan en UTC. No guardar edad calculada ni prefijos regionales por separado.
- Para WhatsApp, la interfaz podrá derivar el destino quitando únicamente el signo `+` de un teléfono ya validado. No almacenar una URL adicional ni enviar mensajes automáticamente. Los ejemplos no se usan para contactar personas.
- La UI puede mostrar validaciones equivalentes para orientar; el servidor sigue siendo la autoridad. La búsqueda y el formato de lista están pendientes del contrato API de Fernanda.

## Acuerdos necesarios con Fernanda y el orquestador

| Decisión | Propuesta de Diana | Estado |
| --- | --- | --- |
| Aplicación Django y ruta | Fernanda publica nombre y ruta reales; no se crean rutas supuestas | Pendiente |
| Identificador | UUID v4 generado por servidor; JSON string | Pendiente |
| Campos y reglas | Los diez campos del diccionario; teléfono obligatorio; opcionales según tabla | Pendiente |
| Nulidad y unicidad | Solo fecha admite NULL; solo PK es única | Pendiente |
| Propiedad del expediente | Definir con backend; justificar cualquier FK adicional en #2 | Pendiente |
| Errores y escritura | Reglas anteriores de PATCH/PUT y errores por campo | Pendiente |
| Versiones y ejecución | Fernanda publica versiones de Django/DRF/PostgreSQL y comandos reproducibles | Pendiente |
| Modelo y migración | Acordar quién incorpora el modelo al área backend; Diana prepara la migración después de aprobación | Pendiente |

Fernanda puede revisar esta propuesta e inicializar su aplicación. La implementación de serializers/endpoints espera el acuerdo del contrato. Tras confirmación en #2, Diana preparará una única migración inicial en la ruta real; si otro cambio ya creó una inicial, se coordina antes de generar otra.

## Casos de aceptación para la implementación posterior

| Caso | Resultado esperado propuesto |
| --- | --- |
| Alta mínima del ejemplo | Persistir obligatorios; opcionales vacíos/NULL y valores de servidor |
| Falta nombre/apellidos/teléfono, o nombre solo espacios | Error del campo; sin escritura parcial |
| Longitud exactamente al límite / un carácter por encima | Aceptar / rechazar |
| Teléfono como número, sin `+`, con letras o fuera de 8–15 dígitos | Rechazar |
| Fecha inexistente, futura o cadena vacía | Rechazar; `null` sí válido |
| Correo vacío / correo mal formado | Aceptar / rechazar |
| NULL en texto opcional u obligatorio | Rechazar |
| Teléfono o correo compartido por dos pacientes | Permitir, si se aprueba la no unicidad |
| PATCH omite un campo / lo limpia explícitamente | Conservar / limpiar según diccionario |
| Enviar ID, timestamp o campo desconocido | Rechazar |
| Actualizar paciente | Conservar ID/created_at y actualizar updated_at |
| Acceso de usuario no autorizado | Rechazar según política que publique Fernanda |

Estos son criterios propuestos, no resultados de pruebas ejecutadas.
