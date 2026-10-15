# Sprint 1 - Base operativa y flujo inicial

**Fecha:** 6 de octubre de 2026  
**Sprint Goal:** dejar un repositorio gobernado y un incremento demostrable de autenticación y gestión básica de pacientes, sin romper los contratos entre capas.

## Historias comprometidas

| ID | Resultado | Responsable líder | Dependencia |
| --- | --- | --- | --- |
| HU-01 | Inicio de sesión seguro | Fernanda + Genny | Modelo de usuario y contrato de autenticación. |
| HU-02 | Lista y búsqueda de pacientes | Genny + Fernanda | Esquema de paciente de Diana. |
| HU-03 | Alta y edición de paciente | Genny + Fernanda | Validaciones y migración de Diana. |
| HU-04 | Expediente básico | Genny + Fernanda | Relaciones de datos y contrato API. |
| S1-QA | Casos de prueba, CI inicial y evidencia | Alex | PRs de las historias. |

## Actividades por área

### Diana - datos

1. Diseñar el diagrama y diccionario de datos en `docs/data/`.
2. Crear el modelo inicial de paciente y sus migraciones en su rama de datos.
3. Publicar campos, restricciones y datos ficticios de prueba antes de que backend implemente endpoints.

### Fernanda - backend

1. Inicializar Django/DRF dentro de `backend/`.
2. Implementar autenticación y endpoints de pacientes conforme al contrato aprobado.
3. Agregar pruebas API y documentar los endpoints en `docs/api/`.

### Genny - frontend

1. Inicializar React/Vite dentro de `frontend/`.
2. Implementar pantallas de acceso, lista/búsqueda y formulario de pacientes.
3. Consumir únicamente el contrato de API publicado y añadir pruebas de componentes.

### Alex - QA/CI

1. Definir casos de prueba críticos en `docs/qa/`.
2. Configurar GitHub Actions en `.github/workflows/` una vez que existan los comandos de prueba.
3. Verificar criterios de aceptación, regresiones y evidencia de cada PR.

## Secuencia de integración

1. Diana entrega modelo/migración y contrato de datos mediante PR.
2. Orquestador verifica campos y dependencias; revisión humana integra a `develop`.
3. Fernanda publica contrato API y endpoints; Genny implementa contra ese contrato.
4. Alex activa CI y ejecuta las pruebas de integración.
5. Orquestador valida la compatibilidad completa antes de declarar el incremento apto.

## Replanificación por fecha fija

Los Sprints 2 y 3 quedan reservados para el 7-8 y 9 de octubre, respectivamente. Se crearán tras la Review del Sprint 1 con el alcance real restante: primero consultas, mediciones, historial y evolución; después estabilización, pruebas, documentación y solo funciones secundarias que no arriesguen el núcleo del MVP.
