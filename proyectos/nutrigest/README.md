# NutriGest

Aplicación académica de seguimiento nutricional con React, Django REST Framework y PostgreSQL. Incluye acceso, pacientes, consultas, mediciones, historial, comparación y notas preliminares. Un orquestador Python organiza trece tareas por responsable y dependencias, genera prompts y ofrece ejecución aislada con Codex CLI.

Entrega acordada: **6–8 de octubre de 2026**, tres iteraciones diarias contando el día de inicio. La implementación inicial está preparada por Codex; la revisión y aceptación de cada integrante sigue pendiente. El tablero conserva tareas pendientes para esa revisión y no atribuye al equipo trabajo que no ha realizado.

## Preparación en Windows

Requisitos: Python 3.12, Node.js 22.12 o posterior, Git y PostgreSQL 17. Docker es opcional para la base de datos. Codex CLI solo es necesario para ejecutar agentes desde el orquestador; el modo prompt funciona con Codex desktop.

1. Copia `.env.example` a `.env`. Completa `DJANGO_SECRET_KEY`, `POSTGRES_PASSWORD` y `DEMO_PASSWORD` (mínimo 12 caracteres). `.env` no se publica.
2. Si usas Docker, ejecuta `docker compose up -d db`. Si usas una instalación PostgreSQL, crea una base y cuenta `nutrigest` y configura su acceso en `.env`.
3. Desde la raíz ejecuta:

```powershell
./scripts/setup.ps1
```

Alternativa manual:

```powershell
py -3.12 -m venv .venv
./.venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
./.venv/Scripts/python.exe backend/manage.py migrate
./.venv/Scripts/python.exe backend/manage.py seed_demo
cd frontend
npm.cmd ci
npm.cmd run build
```

El seed crea tres expedientes ficticios y cuenta `demo` con la contraseña `DEMO_PASSWORD` definida localmente. Si ya existe la cuenta, no cambia su contraseña. No crea usuarios con acceso de administrador.

## Iniciar la aplicación

En una terminal desde la raíz:

```powershell
./.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000
```

En otra terminal desde frontend:

```powershell
npm.cmd run dev
```

Abrir http://127.0.0.1:5173 y entrar como `demo`. El proxy de Vite conecta la interfaz con Django en 8000. Estos comandos son para desarrollo local, no constituyen un despliegue productivo.

Para una prueba sin PostgreSQL, puedes usar `./scripts/setup.ps1 -SQLite`; al iniciar backend mantén `$env:NUTRIGEST_SQLITE='1'` en esa terminal. Esta opción de ensayo no reemplaza PostgreSQL en el entorno principal.

## Orquestación y reparto de tareas

```powershell
python -m orchestrator.runner board
python -m orchestrator.runner next --sprint 1
python -m orchestrator.runner prompt T01
```

Diana: datos y migraciones. Genny: backend y API. Jilder: React e integración. Luisa: calidad y pruebas. Orquestador: coordinación y revisión de dependencias. Lee `docs/ORQUESTADOR.md` para estados, ejecución opcional `run`, revisión y worktrees. No se han iniciado las sesiones personales de los integrantes ni una ejecución real de Codex CLI desde este runner.

## GitHub

Repositorio privado: https://github.com/lortizbaeza-gif/nutrigest

Tres milestones, Sprint 1, Sprint 2 y Sprint 3, con cierre el 6, 7 y 8 de octubre de 2026. Trece Issues documentan responsable, agente, dependencias y criterios de aceptación. Los tres compañeros están asignados por nombre; faltan sus usuarios e invitaciones para asignación a cuentas reales. Las tareas de Luisa se asignan a lortizbaeza-gif.

La implementación inicial se entrega mediante la rama codex/initial-mvp y su Pull Request. Las pruebas locales se documentan en docs/VALIDACION.md; consulta Actions para el resultado de CI remoto.

`orchestrator/team.json` conserva los nombres y usuarios disponibles. Los cuerpos de las Issues están en `docs/github-issues/`. El script opcional `python scripts/github_setup.py` permite crear las entidades de planificación mediante GitHub CLI previamente autenticado; no sube el código y evita duplicar IDs de tarea existentes.

## Verificación

```powershell
$env:NUTRIGEST_TEST='1'
./.venv/Scripts/python.exe backend/manage.py test clinic
./.venv/Scripts/python.exe -m unittest discover -s tests -v
cd frontend
npm.cmd run build
```

CI configurado para PostgreSQL 17 y compilación React. Resultados locales y límites en `docs/VALIDACION.md`; no declarar CI remoto aprobado sin ejecutarlo.

## Alcance

`docs/API.md`: rutas, campos y reglas provisionales. `docs/SPRINTS.md`: tareas y recortes de alcance. Historia clínica completa, nota formal, IA opcional, WhatsApp, no retorno y auditoría de correcciones no forman parte de esta versión. Las reglas clínicas requieren revisión de la nutrióloga. Solo se usan datos ficticios.
