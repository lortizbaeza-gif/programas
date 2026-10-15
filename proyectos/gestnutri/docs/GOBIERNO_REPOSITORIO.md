# Gobierno del repositorio

## Ramas

- `main`: versión estable y entregable. Solo recibe PR desde `develop`.
- `develop`: integración del Sprint. Solo recibe PR aprobados desde ramas de trabajo.
- `feature/HU-XX-descripcion`: una historia, una responsabilidad y una PR hacia `develop`.
- `fix/descripcion` y `docs/descripcion`: correcciones o documentación con la misma regla de PR.

No se hace `push` directo a `main` ni a `develop`.

## Delimitación de responsabilidad

| Rol | Puede liderar y modificar | Requiere coordinación previa |
| --- | --- | --- |
| Genny / frontend | `frontend/`, `docs/ui/` | Contratos en `docs/CONTRATOS/` y cualquier cambio de API. |
| Fernanda / backend | `backend/`, `docs/api/` | Modelos, migraciones y contratos. |
| Diana / datos | `database/`, migraciones y `docs/data/` | Modelo de datos, relaciones y cambios de persistencia. |
| Alex / QA | `tests/`, `.github/`, `docs/qa/` | Cambios de CI y criterios de prueba. |

Nadie modifica el área de otra persona dentro de su rama sin una Issue de coordinación y revisión del propietario. Una historia transversal se divide en subramas por área y se integra mediante PRs pequeños.

## Puerta del orquestador

Antes de aprobar o fusionar una PR, el orquestador debe verificar:

1. La PR se limita a su historia y al área declarada.
2. Los contratos React-API-datos coinciden y cualquier cambio está documentado.
3. Hay migración cuando se cambió el modelo de datos y no hay secretos/datos reales.
4. Las pruebas y CI requeridos pasaron.
5. El propietario de código y una persona humana dieron revisión.

El orquestador deja su conclusión en la PR como **Apto para revisión humana** o **Cambios solicitados**. No aprueba su propio código ni fusiona directamente en `main`.

## Definition of Done

Una historia está terminada únicamente cuando cumple sus criterios de aceptación, contiene las pruebas y documentación necesarias, pasa CI, tiene revisión humana y ha superado la verificación del orquestador.
