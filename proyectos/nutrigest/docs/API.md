# Contrato API de NutriGest

Base /api/. Sesiones de Django; el navegador usa cookies HttpOnly y token CSRF en escrituras. Todas las consultas de expedientes se filtran por la cuenta actual. Respuesta paginada de pacientes: count, next, previous, results (50 por página).

| Método | Ruta | Comportamiento |
|---|---|---|
| GET | /csrf/ | csrfToken y cookie para el login |
| POST | /login/ | username, password; devuelve cuenta y token rotado |
| POST | /logout/ | Cierra sesión; requiere CSRF |
| GET | /me/ | Cuenta de la sesión; 403 sin sesión |
| GET / POST | /patients/ | Listar, buscar con search y page, crear |
| GET / PATCH | /patients/{id}/ | Recuperar o editar un expediente propio |
| GET | /patients/{id}/history/ | Consultas ordenadas de más reciente a más antigua |
| GET | /patients/{id}/compare/?before=ID&after=ID | Diferencias entre dos consultas del mismo paciente |
| POST | /consultations/ | Crear consulta con measurements de forma atómica |
| GET | /consultations/{id}/ | Recuperar consulta de la cuenta |

Paciente: name obligatorio (150 caracteres), birth_date opcional, phone (25), allergies, preferences, restrictions. ID propio del sistema; nombres iguales no se consideran el mismo paciente. No existe deduplicación automática.
Consulta: patient, date (no futura), notes, measurements. Campos de historia clínica completa y formato de nota formal pendientes.
Medición: kind weight/fat/muscle; value decimal o null; unit kg/%; method texto. Peso solo kg; porcentajes entre 0 y 100. Un dato vacío es null; cero sigue siendo cero.
Comparación: resta after - before con decimales. Requiere unidades iguales y método explícito coincidente. Si falta dato o método o hay incompatibilidad, delta es null y reason explica por qué. Cambios de porcentajes se muestran en puntos porcentuales. No se realiza interpretación clínica.

Provisionales para validar: campos obligatorios de expediente y métodos comparables. No tomar estas decisiones técnicas como aprobación de la cliente.
