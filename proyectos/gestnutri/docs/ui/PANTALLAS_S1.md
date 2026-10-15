# Pantallas de Sprint 1

Fuente leída: docs/data/DICCIONARIO_PACIENTE.md y CONTRATO_PACIENTE_S1.md en origin/feature/HU-02-patient-data. Propuesta v1 de Diana, pendiente de aprobación; no es contrato definitivo. No se agregaron campos de paciente.

| Campo | Presentación/edición provisional |
| --- | --- |
| first_name | Nombre, obligatorio, 1–100 caracteres recortados |
| last_name | Apellidos, obligatorio, 1–150 caracteres recortados |
| phone | Teléfono obligatorio, texto internacional + y 8–15 dígitos |
| email | Opcional, máximo 254; orientación de formato en UI, no equivalencia al validador Django |
| birth_date | Opcional, fecha real; vacío se representa como null; límite visual según fecha UTC, como el servidor |
| allergies | Texto plano opcional, máximo 2000; vacío significa No informado |
| restrictions | Texto plano opcional, máximo 2000; vacío significa No informado |
| id | Identificador opaco, solo interno; UUID generado localmente por el mock |
| created_at / updated_at | Solo lectura, generados por el mock, no editables |

Lista muestra nombre y contacto; expediente muestra los siete campos editables. El formulario usa la definición centralizada de campos. No se valida unicidad de teléfono/correo. Estas reglas solo orientan la demostración y se revisarán tras la aprobación; la comprobación visual de fecha y el validador de correo no sustituyen validación de servidor.

Acceso en modo API solicita username y password según v1-auth.md de PR #9, usando autocompletado username/current-password y campo de contraseña oculto. En modo mock conserva el botón explícito de simulación.

Accesibilidad: etiquetas asociadas mediante contención, controles nativos de teclado, foco visible, foco en título al navegar y primer campo inválido al guardar, errores asociados con aria-describedby/aria-invalid, mensajes role=alert/status, acciones descriptivas por paciente, tablas con encabezados y diseño adaptable. Flujo manual verificado en navegador el 7 de octubre de 2026; pendiente lector de pantalla y revisión cruzada.
