# Demostración de NutriGest

1. Iniciar sesión con la cuenta demo y contraseña definida en .env.
2. Buscar Paciente ficticio A y abrir el expediente.
3. Revisar las consultas del 01/09/2026 y 01/10/2026.
4. Comparar: peso -0.70 kg, grasa -0.50 puntos porcentuales y músculo +0.40 puntos porcentuales.
5. Crear un expediente ficticio y una consulta. Dejar un indicador vacío y observar Sin dato; no se convierte en cero.
6. Registrar una segunda consulta con el mismo método y comparar. Mostrar el aviso cuando no hay mediciones comparables.
7. Mostrar Equipo y sprints. Explicar responsables, tres iteraciones y dependencias.
8. Ejecutar python -m orchestrator.runner next --sprint 1 y prompt T01. Explicar que la tarea requiere revisión y que una dependencia incompleta impide iniciar otra.
9. Presentar resultados de docs/VALIDACION.md y aclarar funciones pendientes.

No usar datos de pacientes reales ni contactar a terceros durante la demostración.
