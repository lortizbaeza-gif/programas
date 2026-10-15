# Evidencia de integración local — 7 de octubre de 2026

Frontend probado: `b054b4699ba90797547f9cd2603c063fe8c13de1`, rama `feature/HU-02-patient-frontend`. El recorrido de navegador y HTTP se ejecutó antes de crear el commit sobre este código local; las siete pruebas y el build se repitieron después del commit. El commit posterior de documentación no cambia código de frontend.
Backend de PR #9: ef9356faaa0b46b69c44a95b65f8a941e1168dde, incluye migración inicial de Diana. Se extrajo una copia de solo prueba bajo frontend/.integration/; no se modificó el código de backend ni se fusionaron ramas.

Entorno: Windows, Python 3.14, Node 24.18.0, Vite 7.3.7, Django 5.2.18, DRF 3.16.1, PostgreSQL 17.10 (distinto de 17.11 de Fernanda), UTF8, proveedor ICU, locale es. Clúster temporal en loopback:55440, separado del servicio PostgreSQL habitual. Solo cuenta/paciente ficticios.

## Verificaciones

- npm test: 7/7 pruebas de adaptadores y validaciones.
- npm run build: correcto.
- manage.py migrate --noinput: migraciones aplicadas, incluida patients.0001_initial.
- manage.py test accounts patients --noinput: 21/21 sobre PostgreSQL.
- manage.py makemigrations --check --dry-run: No changes detected.
- git diff --check: sin errores de whitespace.

La ejecución inicial sin especificar apps, desde la raíz de frontend, descubrió 0 pruebas; se corrigió el directorio y se ejecutaron explícitamente accounts y patients. No se cuenta esa ejecución inicial como validación.

## Navegador, frontend real con proxy

1. Credenciales inválidas: muestra Credenciales inválidas.
2. Login válido: entra y muestra la lista vacía.
3. Alta de Ana María Prueba Integración: muestra éxito y expediente.
4. Edición: guarda alergia ficticia y se muestra en expediente.
5. Búsqueda ana maría: encuentra el registro; ana maria: lista vacía.
6. Recarga: recupera sesión y el paciente/editado persiste.
7. Logout y recarga: permanece en pantalla de acceso.

Captura: INTEGRACION_S1.png, expediente con datos exclusivamente ficticios. No contiene cookies, tokens ni claves.

## HTTP a través de Vite

- POST sin CSRF: 403.
- Nombre vacío, teléfono inválido y fecha futura: 400 con errores por campo.
- PATCH con email vacío y birth_date null: 200; conserva alergias omitidas.
- UUID inexistente: 404.
- Logout: 204; listado posterior sin sesión: 403.

La prueba HTTP complementa el navegador; no se afirma que los errores 400/403/404 se hayan reproducido visualmente en el formulario. La suite backend comprueba la separación entre propietarios; no se realizó una prueba manual en navegador con una segunda cuenta.

## Pendiente y alcance

Cambios exclusivamente en frontend/ y docs/ui/. Contratos revisados: INTEGRACION_LOCAL_S1.md, v1-auth.md y v1-patients.md de PR #9. Todavía son documentos pendientes de revisión del equipo: esta evidencia no los aprueba. Mantener PR #6, #9 y #12 abiertas; no se fusionó ni cerró ninguna PR.

Pendiente revisión cruzada de Diana, QA/orquestador y revisión humana. La evidencia se publica en la PR #11 junto con el hash exacto de frontend y backend probados. QA debe repetir la integración y registrar su dictamen; estos resultados son de frontend, no aprobación de QA. El clúster y los servidores temporales se detuvieron al terminar; los archivos de prueba quedan ignorados por Git.
