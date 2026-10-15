# API v1 de seguimiento nutricional — propuesta de backend

Estado: borrador para coordinación de #18 con Diana (#17, PR #21) y el
orquestador. Las rutas de Sprint 2 descritas aquí todavía no están implementadas.
Genny puede revisar el contrato; no debe presentar estos endpoints como disponibles.
No cierra #18 ni autoriza migraciones o integración por sí solo.

Base de esta rama: `develop` integrado `ca9f976`. Conserva Sprint 1 sin cambios.
Referencia de datos revisada: propuesta de Diana `25a094cc5fe1a3ac4d8c507d73a18c1647c54729`.

## Decisiones de backend para confirmar conjuntamente

Backend acepta como diseño propuesto las relaciones Patient 1:N Consultation,
Consultation 0..1 Measurement y Consultation 0..N ManualNote, todas con PROTECT.
La propiedad se deriva de Patient.owner; no hay owner duplicado, transferencia,
reasignación de consulta ni autor distinto del propietario en este alcance.
Las notas son históricas de consulta y no modifican allergies/restrictions de Patient.

Proponemos app `followup`, modelos `Consultation`, `Measurement`, `ManualNote`,
tablas Django `followup_consultation`, `followup_measurement`, `followup_manualnote`.
Fernanda materializará un único modelo después de confirmar el acuerdo; Diana
generará `backend/followup/migrations/0001_initial.py` desde ese commit exacto.
Dependencia de la inicial: `patients.0001_initial`. No regenerar la inicial de Patient.
El SHA del modelo se publicará cuando exista; todavía no hay modelo ni migración S2.

Proponemos peso como única medición mínima, decimal(6,2) en kg, >0 y <=9999.99.
Este máximo es técnico; no es un rango ni recomendación clínica. El orquestador
debe confirmar que peso basta para HU-06 a HU-10 antes de fijar el esquema.
No añadir talla, IMC, perímetros, diagnósticos ni IA sin un acuerdo nuevo.

## Sesión, permisos y formato común

Base `/api/v1/`. Misma sesión Django, cookies y CSRF de Sprint 1; usar
`credentials: 'include'`, rutas relativas y el proxy del frontend. Obtener CSRF
antes del login, conservar el token rotado y enviarlo en POST. Ver `v1-auth.md`.

Cada ruta requiere sesión y filtra desde el servidor por el propietario del
paciente, incluso para staff/superusuarios. Un paciente, consulta o recurso
ajeno devuelve 404 como uno inexistente. El paciente se toma de la URL y la
consulta de la URL para mediciones/notas; no se aceptan relaciones en el body.
No aceptar ni exponer owner. No hay acceso global ni transferencias.

Entrada JSON estricta: rechazar claves desconocidas y campos de solo lectura.
IDs UUID v4 y timestamps generados por servidor. Fechas conscientes de zona
en ISO 8601 con offset; respuesta UTC. No aceptar fecha sin zona o futura.
Capturar un solo instante de recepción para validar occurred_at.

Listas: `{"count":0,"next":null,"previous":null,"results":[]}`;
`page` desde 1, `page_size` por defecto 20, máximo 100. Página inexistente 404,
parámetros inválidos 400. Aplicar orden antes de paginar.

Errores: 400 campos/JSON/parámetros inválidos; 403 sin sesión o CSRF; 404 ajeno
o inexistente; 405 método no admitido; 415 tipo de contenido no soportado.
Validación de body: listas por campo o `non_field_errors`; otros errores `detail`.
No depender de texto de mensajes como código estable. Escrituras atómicas.
Solo GET/POST, además de HEAD/OPTIONS; no PATCH, PUT ni DELETE en este mínimo.

## Rutas propuestas

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET, POST | `patients/{patient_id}/consultations/` | Lista paginada / alta 201 |
| GET | `consultations/{consultation_id}/` | Detalle 200 |
| GET, POST | `consultations/{consultation_id}/measurements/` | Lista paginada de 0..1 / alta 201 |
| GET | `measurements/{measurement_id}/` | Detalle 200 |
| GET, POST | `consultations/{consultation_id}/notes/` | Lista paginada / alta 201 |
| GET | `notes/{note_id}/` | Detalle 200 |
| GET | `patients/{patient_id}/history/` | Historial paginado 200 |
| GET | `consultations/{consultation_id}/evolution/` | Comparación derivada 200 |

### Consulta

POST recibe únicamente `{"occurred_at":"2026-10-01T15:00:00-06:00"}`.
El ejemplo es ficticio y debe ser anterior al instante del servidor en la prueba.
Devuelve `id`, `patient` (UUID), `occurred_at`, `created_at`, `updated_at`.
Lista descendente `(occurred_at, created_at, id)`. Se permite registro retroactivo.
Una consulta puede existir sin medición ni notas; no hay alta compuesta implícita.

### Medición

POST recibe únicamente `{"weight_kg":"70.00"}`. Peso obligatorio; contrato de
transporte como cadena decimal, hasta dos decimales y sin notación exponencial.
Rechazar null, vacío, booleanos, números JSON, NaN, infinito, cero, negativos,
exceso de escala o rango; no redondear silenciosamente. Respuesta weight_kg
como cadena de dos decimales. No usar float para almacenar ni comparar.
Devuelve `id`, `consultation` (UUID), `weight_kg`, `created_at`, `updated_at`.
Lista ordenada `(created_at, id)`; cardinalidad máxima uno. Segunda alta devuelve
400 con `non_field_errors`, sin reemplazar ni alterar la primera; la restricción
UNIQUE y el manejo de concurrencia deben mantener esa respuesta sin error 500.

### Nota manual

POST recibe `{"kind":"note","text":"Seguimiento ficticio"}`.
Ambos requeridos. kind exactamente `note`, `preference` o `restriction`;
text string no blanco, recortado, 1..2000 caracteres. No recibir contenido generado
por IA. Devuelve `id`, `consultation`, `kind`, `text`, `created_at`, `updated_at`.
Lista ascendente `(created_at, id)`. No sustituye datos actuales de Patient.

### Historial

Lista descendente de consultas del paciente con los mismos campos de consulta
y `measurement`, que es el objeto completo de medición o null. Las notas se
consultan en su ruta paginada para evitar listas históricas sin límite dentro
de cada consulta. No almacenar una tabla paralela de historial.

### Evolución

Para la consulta de la URL, comparar con la inmediatamente anterior del mismo
paciente en orden ascendente `(occurred_at, created_at, id)`. Considerar todas
las consultas, no solo una página; no saltar consultas sin medición. Una alta
retroactiva modifica la comparación al siguiente GET; no persistir diferencias.

Respuesta: `consultation_id`, `status`, `previous_consultation_id`,
`previous_weight_kg`, `current_weight_kg`, `delta_kg`. Pesos/delta son cadenas
con dos decimales o null. IDs anteriores null si no existe consulta anterior.
`delta_kg = actual - anterior` con Decimal exacto, sin porcentajes ni valoración
mejor/peor. UUID solo desempata establemente, no expresa anterioridad clínica.

Precedencia: valor presente inválido -> invalid_data; sin anterior -> first;
con anterior y algún peso ausente -> insufficient_data; dos pesos válidos ->
increase/decrease/equal según el signo del delta. Un valor corrupto devuelve
null en el campo de peso inválido, nunca NaN/Infinity en JSON ni texto clínico.
invalid_data es defensivo; no autoriza almacenar valores inválidos.

| Caso | Anterior | Actual | status | delta_kg |
| --- | --- | --- | --- | --- |
| Primera | sin consulta | 70.00 | first | null |
| Primera sin peso | sin consulta | null | first | null |
| Aumento | 70.00 | 71.25 | increase | 1.25 |
| Disminución | 70.00 | 69.50 | decrease | -0.50 |
| Igualdad | 70.00 | 70.00 | equal | 0.00 |
| Falta peso anterior/actual | algún peso null | — | insufficient_data | null |
| Valor presente inválido | 70.00 | -1.00 | invalid_data | null |

Ejemplo ficticio:

```json
{
  "consultation_id": "80ca7db3-83a6-4b8b-9e39-884c607982ea",
  "status": "increase",
  "previous_consultation_id": "9cbb480f-bff5-4e06-9fc3-41c8f16d0014",
  "previous_weight_kg": "70.00",
  "current_weight_kg": "71.25",
  "delta_kg": "1.25"
}
```

## Puerta previa y validación pendiente

Diana debe confirmar la correspondencia con su diccionario/ERD y el contrato
de transporte decimal; el orquestador debe confirmar alcance mínimo de peso y
el reparto de modelo/migración. Entonces Fernanda publicará el SHA del modelo
único para que Diana genere su inicial. Revisar la migración antes de implementar
los endpoints sobre ella. No asumir aceptación por silencio.

Entorno propuesto: PostgreSQL 17.11, UTF8, ICU es, base nueva aislada sin datos
reales, settings normales y variables POSTGRES_* de Sprint 1. El entorno S1
no acredita S2. Registrar versión/collation/SHAs en la ejecución S2.

Pruebas futuras: migrate/plan/showmigrations/repetición, makemigrations check,
CHECK/FK/UNIQUE, escrituras directas, autenticación/CSRF, aislamiento de dos
propietarios, validaciones estrictas, doble medición concurrente, paginación y
empates, retroactividad, seis estados, notas históricas, persistencia y regresión S1.
No se afirman pruebas PostgreSQL S2 hasta disponer del esquema coordinado.
