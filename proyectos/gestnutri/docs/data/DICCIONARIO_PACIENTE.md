# Diccionario de Paciente — Sprint 1

Responsable: Diana (`dianabojorquezcetina-max`). Referencias: Issues #2 y #3.

**Estado: propuesta v1 para revisión de Fernanda y del orquestador; no es un contrato aprobado ni una implementación.** Los nombres siguientes son la única propuesta canónica para API y modelo. No hay alias. Véanse [contrato](CONTRATO_PACIENTE_S1.md) y [ERD](ERD_S1.md).

| Campo canónico | Tipo JSON / Django propuesto / PostgreSQL | Entrada al crear | Nulidad y valor por defecto | Validación propuesta | Ejemplo ficticio |
| --- | --- | --- | --- | --- | --- |
| `id` | string UUID / UUIDField(primary_key=True) / uuid | Solo lectura | NOT NULL; UUID v4 generado en servidor | Inmutable; no aceptar en entradas | `f58b634c-daf9-4b8c-9c23-a25f9c837fd2` |
| `first_name` | string / CharField(100) / varchar(100) | Obligatorio | NOT NULL; sin defecto | Recortar extremos; 1–100 caracteres; rechazar solo espacios; admitir acentos, espacios internos, guiones y apóstrofos | `Ana María` |
| `last_name` | string / CharField(150) / varchar(150) | Obligatorio | NOT NULL; sin defecto | Recortar extremos; 1–150 caracteres; mismas reglas que nombres | `Ejemplo Prueba` |
| `phone` | string / CharField(16) / varchar(16) | Obligatorio | NOT NULL; sin defecto | Formato internacional: `^\+[1-9][0-9]{7,14}$`; conservar como texto; no inferir país ni quitar dígitos | `+12025550123` |
| `email` | string / EmailField(254, blank=True) / varchar(254) | Opcional | NOT NULL; `""` al omitir | Recortar extremos; correo válido según validador de Django; máximo 254; `""` borra el valor | `ana.ejemplo@example.com` |
| `birth_date` | string de fecha o null / DateField(null=True, blank=True) / date | Opcional | NULL al omitir | Fecha real `AAAA-MM-DD`, no posterior a fecha local del servidor; `null` borra; no aceptar `""` | `1990-04-15` |
| `allergies` | string / TextField(blank=True) / text | Opcional | NOT NULL; `""` al omitir | Recortar extremos; máximo 2000 caracteres; texto plano; vacío significa no informado | `Alergia ficticia a cacahuate` |
| `restrictions` | string / TextField(blank=True) / text | Opcional | NOT NULL; `""` al omitir | Recortar extremos; máximo 2000 caracteres; texto plano; vacío significa no informado | `Restricción ficticia de lactosa` |
| `created_at` | string fecha-hora / DateTimeField(auto_now_add=True) / timestamp with time zone | Solo lectura | NOT NULL; servidor al crear | ISO 8601 en UTC, inmutable desde API | `2026-10-06T18:00:00Z` |
| `updated_at` | string fecha-hora / DateTimeField(auto_now=True) / timestamp with time zone | Solo lectura | NOT NULL; servidor al crear/actualizar | ISO 8601 en UTC; actualizado por servidor | `2026-10-06T18:00:00Z` |

## Reglas comunes

- UUID es una **propuesta pendiente de confirmación de Fernanda**; permite tratar `id` como identificador opaco en el frontend. No mezclar UUID y entero al implementar.
- Solo `id` es único. Nombres, teléfono y correo pueden repetirse (familias pueden compartir contacto). No usar teléfono como clave primaria.
- `null` solo se acepta para `birth_date`. Un campo opcional omitido al crear usa el defecto de la tabla. En PATCH, omitir significa conservar; enviar `""` limpia un texto opcional y `null` limpia la fecha.
- No convertir números, booleanos, listas u objetos en texto automáticamente. La API validará tipo, longitud y formato antes de guardar.
- `allergies=""` no equivale a «sin alergias»: no hay información registrada. No inferir hechos clínicos a partir de un campo vacío.
- Obligatorios, longitudes, formato internacional, límites de texto y unicidad son propuestas que deben aceptarse expresamente en #2 antes de implementar.

## Reparto de validaciones

Fernanda implementará validaciones de servidor en su área. Diana reflejará las restricciones acordadas en la migración: PK, NOT NULL, longitudes y restricciones CHECK de nombres no vacíos, teléfono y límites de textos, cuando se acuerde su representación en el modelo. Una restricción dinámica de fecha futura se valida en servidor, no mediante un CHECK dependiente del día actual. Un campo Django con validadores no garantiza por sí solo validación en escrituras SQL directas.

No se añaden consultas, mediciones, notas, documentos ni campos extra en este Sprint. La relación de propiedad del paciente requiere una decisión explícita antes de habilitar acceso a datos; véase el ERD.
