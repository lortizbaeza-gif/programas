# Orquestador de tareas para Codex

El orquestador es un programa Python ejecutable. Lee orchestrator/backlog.json, asigna por rol, bloquea tareas con dependencias pendientes, detecta ámbitos de archivos compartidos y genera prompts. Cuenta con ejecución opcional de Codex CLI en una rama y worktree por tarea. No requiere una API key para mostrar el backlog o generar instrucciones.

## Uso en Codex desktop

Abrir el repositorio nutrigest como proyecto. Cada integrante puede usar una sesión de Codex con su archivo de agents/. Ejecutar desde la raíz:

```powershell
python -m orchestrator.runner board
python -m orchestrator.runner next --sprint 1
python -m orchestrator.runner prompt T01
python -m orchestrator.runner status T01 en_curso
```

Copiar el prompt a la sesión del integrante correspondiente. Un agente no altera las tareas de los demás. El equipo utiliza ramas por tarea, revisa PRs y sincroniza el backlog.

## Ejecución con Codex CLI

Requiere Git, Codex CLI instalado y sesión de Codex iniciada, un commit y árbol limpio. No está ejecutada automáticamente al abrir el proyecto:

```powershell
python -m orchestrator.runner run T01
```

Se crea worktrees/T01 y rama codex/t01; Codex ejecuta con sandbox workspace-write. La salida se conserva en .orchestrator-runs/T01. Un resultado exitoso pasa a en_revision, nunca directamente a terminada. El orquestador no fusiona ni publica cambios.

## Revisión y dependencia siguiente

```powershell
python -m orchestrator.runner status T01 en_revision --evidence "Commit, comandos y resultados verificables"
python -m orchestrator.runner status T01 terminada --evidence "Revisión humana y cambios integrados: referencia al commit o PR"
python -m orchestrator.runner next --sprint 1
```

La transición terminada es una decisión del revisor; el texto de evidencia no es una verificación automática del PR. Con ejecución run, en_revision ya queda registrado. Confirma los cambios del backlog en Git antes de iniciar otra ejecución. No iniciar dos comandos de mutación simultáneamente; la ejecución inicial del coordinador es secuencial. Los worktrees se conservan para revisión, no se borran automáticamente.

Para bloquear y reintentar: status Txx bloqueada --evidence "Motivo" y luego status Txx pendiente. No renombrar dependencias ni inventar tareas terminadas. El tablero de React refleja el JSON al compilar o recargar, no es una base de tareas colaborativa en tiempo real.

Cada agente usa el inicio de sesión del integrante que lo ejecuta. La conexión GitHub de esta conversación no inicia sesión en las computadoras de los otros integrantes ni en Codex CLI.

Referencia: https://learn.chatgpt.com/docs/developer-commands?surface=cli
