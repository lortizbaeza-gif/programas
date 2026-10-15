# NutriGest Plan de entrega en tres días

Plazo acordado por la usuaria: 6 a 8 de octubre de 2026, contando hoy. Sustituye las fechas de entrega anteriores para esta implementación. Son tres iteraciones diarias de trabajo, sin afirmar que corresponden al marco Scrum completo.

Objetivo: demostrar autenticación, alta y búsqueda de pacientes, registro de consultas y mediciones, historial y comparación numérica. React, Django, Django REST Framework y PostgreSQL. Solo datos ficticios. Reglas y campos pendientes de validación se documentan como provisionales.

| Sprint | Responsable | Tarea | Dependencia | Criterio de aceptación |
|---|---|---|---|---|
| 1 · 6 octubre | Orquestador | T01 Estructura y contrato API | Ninguna | Estructura documentada; endpoints y campos compartidos |
| 1 | Diana | T02 Modelo Patient y Consultation | T01 | Migraciones aplicables; consultas vinculadas al paciente |
| 1 | Genny | T03 Sesión y API de pacientes RF01–04 | T02 | Acceso sin sesión rechazado; alta, búsqueda y edición válidas |
| 1 | Jilder | T04 Login y pacientes | T01; integración T03 | Login, lista y formulario con errores visibles |
| 1 | Luisa | T05 Pruebas de acceso y pacientes | T03 | Verificar acceso denegado, alta válida y campos inválidos |
| 2 · 7 octubre | Diana | T06 Mediciones y datos alimentarios RF07,10 | T02 | Valor ausente distinto de cero; unidad y método explícitos |
| 2 | Genny | T07 API consultas, historial y comparación RF06–09,11–12 | T06 | Orden por fecha; diferencias correctas; aviso si no comparable |
| 2 | Jilder | T08 Expediente, consultas e historial | T04,T07 | Registrar consulta y recuperarla al reabrir |
| 2 | Luisa | T09 Casos límite de mediciones | T07 | Ausentes, cero y unidades incompatibles tratados correctamente |
| 3 · 8 octubre | Orquestador | T10 Integrar y congelar alcance | T05,T09 | Revisar entregas y resolver bloqueos; sin funciones nuevas |
| 3 | Diana y Genny | T11 Datos ficticios y correcciones de integración | T10 | Instalación limpia y recorrido reproducible con PostgreSQL |
| 3 | Jilder | T12 Estados vacíos, carga y errores | T08 | Pantallas comprensibles con API real y fallos |
| 3 | Luisa | T13 CI, prueba completa y guion de demostración | T11,T12 | Checks pasan; login→paciente→consulta→historial→comparación |

Cada tarea se propone como Issue y cada sprint como milestone de GitHub. Estados: pendiente, en curso, bloqueada, en revisión, terminada. Una tarea terminada requiere evidencia de ejecución, revisión y cambios integrados. La asignación anterior es por integrante; asignación a cuentas GitHub pendiente de conocer los usuarios.

Fuera de esta entrega: IA opcional RF14, WhatsApp RF17, lista sin retorno RF15 y documentos formales RF13,18–19. RF05 historia clínica completa y RF16,20 requieren definición posterior. No declarar todo el catálogo del Documento 2 implementado. La nota preliminar y datos alimentarios se incluyen solo si el flujo principal ya funciona.

Revisión diaria: inicio con objetivo y bloqueos; punto intermedio para dependencias; cierre con demostración y pruebas. Si hay retraso, retirar extras, conservar el recorrido esencial y registrar el recorte.
