# CI del código integrado — Sprint 1

El workflow conserva su ruta `.github/workflows/s1-pending-integration.yml`,
pero ahora prueba el checkout normal del repositorio en cada job, sin SHA
externos ni carpetas de fuentes separadas.

Se ejecuta en `pull_request` dirigido a `develop`, `push` a `develop` y
`workflow_dispatch`. No usa filtros de rutas: los cambios de producto también
activan la verificación. En una PR, `actions/checkout` comprueba por defecto
el commit de combinación de GitHub; en push, el commit enviado; en ejecución
manual, la referencia seleccionada.

| Capa | Directorio | Comandos |
| --- | --- | --- |
| Backend | `backend/` | `check`, `migrate --plan`, `migrate --noinput`, `showmigrations`, `makemigrations --check --dry-run`, `test accounts patients --noinput` |
| Frontend | `frontend/` | `npm ci`, `npm test`, `npm run build` |

Backend conserva Python 3.13 y el servicio PostgreSQL 17 efímero existente,
con comprobación de salud y variables de prueba. Las credenciales declaradas
son exclusivas de la base desechable del job, sin secretos de despliegue.
Frontend conserva Node 22 y cache npm sobre `frontend/package-lock.json`;
cache pip apunta a `backend/requirements.txt`.

Esta conversión parte de `develop` en
`a255e23b1058a9e9b9731ffcb9d52b49a393400b`, que ya contiene ambas capas.
Solo modifica el workflow y esta documentación. No modifica código de
producto, contratos, pruebas funcionales ni CODEOWNERS.

CI verde acredita estos comandos sobre el código integrado, sin sustituir
E2E de navegador, revisión humana ni aprobación independiente del CODEOWNER.
No se agrega una puerta global de whitespace heredado; `git diff --check`
se ejecuta sobre los cambios de esta PR. No cierra Issues/PRs ni fusiona.
