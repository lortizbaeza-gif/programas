# GestNutri

MVP web para que profesionales de nutrición administren pacientes y den seguimiento a consultas, mediciones e historial.

## Arquitectura

`React (frontend/) → Django REST Framework (backend/) → PostgreSQL`

## Equipo y áreas de código

| Integrante | Rol | Área exclusiva de trabajo |
| --- | --- | --- |
| Alex | QA / tester | `tests/`, `.github/`, `docs/qa/` |
| Fernanda | Backend | `backend/`, `docs/api/` |
| Genny | Frontend | `frontend/`, `docs/ui/` |
| Diana | Base de datos | `database/`, `backend/*/migrations/`, `docs/data/` |
| Orquestador | Integración | Políticas, contratos y verificación transversal; no implementa historias ni aprueba su propio trabajo. |

La delimitación es operativa y se aplica mediante propietarios de código, PR y CI; GitHub no permite impedir técnicamente que un colaborador con acceso de escritura edite una carpeta concreta. Consulte [`docs/GOBIERNO_REPOSITORIO.md`](docs/GOBIERNO_REPOSITORIO.md) antes de crear una rama o un PR.

## Sprint actual

Sprint 1 (6 de octubre de 2026): establecer la base del repositorio, contratos de trabajo y el incremento mínimo de HU-01 a HU-04. El detalle vive en [`docs/sprints/SPRINT_1.md`](docs/sprints/SPRINT_1.md).
