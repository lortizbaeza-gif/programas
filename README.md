# Claro — El clima, sin vueltas

Proyecto académico de aplicación web que consume las API externas de geocodificación y pronóstico de Open-Meteo. HTML, CSS y JavaScript, sin dependencias ni claves secretas.

## Ejecutar

Con Python 3 instalado, abre una terminal en esta carpeta:

```sh
python -m http.server 8080 --directory dist
```

Visita http://localhost:8080. Requiere conexión a internet para consultar la API. El servidor de Python es solo para desarrollo. En producción, el alojamiento debe servir HTTPS y configurar `404.html` para rutas inexistentes.

## Uso

1. Busca una ciudad y selecciona la ubicación correcta.
2. Consulta clima actual y pronóstico de siete días.
3. Guarda ciudades en el navegador o bórralas con “Borrar favoritas”.

## API y errores

- https://open-meteo.com/en/docs/geocoding-api — búsqueda de ubicaciones.
- https://open-meteo.com/en/docs — pronóstico.
- `request()` usa fetch, revisa errores HTTP, maneja 429 y cancela a los 12 segundos.
- Las respuestas vacías no se reemplazan con datos ficticios.
- `loadWeather()` valida la temperatura actual y la existencia del pronóstico.
- Los datos externos se insertan con textContent, sin interpretar HTML.
- No hay claves de API que guardar. Si se añade un servicio con secretos, debe llamarse desde un backend y utilizar variables de entorno. `.env` está excluido de Git.
- Favoritos en localStorage: solo preferencias, sin credenciales.

## Declaración de IA

Se utilizó ChatGPT/Codex para interpretar los requisitos, consultar documentación oficial de Open-Meteo y generar el HTML, CSS, JavaScript y documentación inicial. No se utilizó un modelo de IA como API de la aplicación: la API externa utilizada es meteorológica, opción permitida por la tarea.

**Parte realizada por el estudiante sin IA:** pendiente de completar por el estudiante con una descripción veraz. Esta entrega inicial fue generada con ayuda de IA; no se atribuye al estudiante trabajo que no haya realizado.

## Alcance frente a la lista general

Implementado: encabezado, navegación, buscador, inicio, pie, archivo 404, acerca de, FAQ, contacto informativo, textos de privacidad y condiciones del prototipo, diseño adaptable, uso de teclado y etiquetas de formularios, estados de carga y error, título y descripción SEO.

Pendiente: registro/login/logout, recuperación y verificación de correo, perfil y eliminación de cuenta, base de datos, hash de contraseñas, sesiones y administración. No se simulan estas funciones con contraseñas en el navegador. También falta configurar respaldos, contacto real y el despliegue definitivo de la página 404. No hay formulario de contacto ni captcha. No se ha generado sitemap porque falta la URL definitiva.

No aplican a este prototipo: catálogo, carrito y pagos. No hay analítica ni publicidad. No se inventaron testimonios, redes sociales ni datos de contacto. Los textos legales son informativos del prototipo, no una revisión jurídica.

## Verificación manual antes de entregar

- Buscar Guadalajara, seleccionar una ubicación y contrastar los datos con la respuesta de la API en Herramientas de desarrollador → Red.
- Buscar un nombre inexistente y comprobar el estado sin resultados.
- Desconectar internet y comprobar el mensaje y “Reintentar”.
- Simular HTTP 429 y respuesta vacía con herramientas del navegador.
- Guardar una ciudad, recargar y comprobar persistencia; borrar favoritas.
- Revisar teclado, foco, zoom al 200 % y pantalla móvil.

## Entrega académica pendiente

Consulta `ENTREGA.md`. Repositorio: https://github.com/lortizbaeza-gif/programas. La carga inicial se realizó con ayuda de Codex; no se fabricó un historial de desarrollo del estudiante. El estudiante debe realizar cambios reales y guardarlos durante su propio desarrollo.



## Otros proyectos de programación

Consulta el [índice de proyectos anteriores](proyectos/README.md). Cada proyecto tiene su propia carpeta y una nota de recopilación. Incluye Cine, portal Jaguares, GestNutri, NutriGest, colas en C#, portal de noticias y prácticas de estructuras de datos en Python, web y JavaScript.
