# Validación técnica local de NutriGest

Fecha: 6 de octubre de 2026. Ejecución por Codex; no acredita revisión de la nutrióloga ni trabajo realizado por los integrantes.

| Comprobación | Resultado |
|---|---|
| Django check y migraciones consistentes | Correcto, sin cambios de migración pendientes |
| Pruebas backend con SQLite | 16 aprobadas |
| Pruebas backend con PostgreSQL 17.11 | 16 aprobadas; base de prueba temporal creada y retirada por Django |
| Orquestador: dependencias, estados, ámbito compartido y bloqueo de mutaciones | 9 pruebas aprobadas |
| React y Vite | Compilación de producción correcta después de corregir la fecha |
| Navegador contra API | Login, alta, registro de consulta, recuperación de historial y comparación comprobados con datos ficticios |

La prueba de navegador detectó que la fecha seleccionada podía perderse al editar mediciones. Se agregó el manejo del evento input además de change y se repitió el caso: el registro conserva 20/09/2026, el historial recupera dos consultas y la comparación muestra una diferencia de 0.30 kg con avisos para mediciones ausentes.

Se separó App.jsx del punto de entrada de React para mantener una sola raíz al actualizar el código durante desarrollo.

PostgreSQL local verificado mediante binarios oficiales portátiles; no se instaló un servicio del sistema. La configuración .env y las bases de datos no se publican. El entorno local de demostración usa el puerto 55432 y la cuenta demo; para otros equipos seguir README.md con PostgreSQL o Docker.

Límites: Estado de CI remoto consultable en Actions del repositorio, ejecución real de agentes mediante runner run pendiente. Los archivos de rol y prompts están listos para sesiones Codex, pero no crean sesiones en las cuentas personales de los integrantes. Aceptación humana y reglas pendientes permanecen abiertas. WhatsApp, IA clínica, nota formal, auditoría y seguimiento automático no implementados.
