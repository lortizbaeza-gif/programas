# Brújula · Portal de noticias

**Entrega:** Luisa Ortiz · Balam Agel · Tarea 2.

**Noticias favoritas:** pulsa `Guardar noticia` en una tarjeta y abre `Mis favoritas` para consultar tu colección. Puedes quitarlas pulsando el mismo botón. Se guardan en este navegador mediante localStorage; la API Key no se guarda. Usa siempre el mismo origen, por ejemplo `http://localhost:5502`, para conservar el acceso a tu colección. Esta función se añadió por solicitud del equipo después de las dos mejoras visuales iniciales.

Proyecto de la Tarea 2, desarrollado en HTML, CSS y JavaScript sin frameworks.

## Cómo ejecutarlo

**En este equipo:** haz doble clic en `Iniciar.cmd`. Node.js ya está instalado y el iniciador abre `http://localhost:5502/`. No necesitas instalar Python, Live Server ni paquetes npm. Para apagar el servidor usa `Detener.cmd`. Necesitas internet para consultar noticias y cargar las imágenes originales. Los pasos siguientes son una alternativa con VS Code.

1. Abre la carpeta `portal-noticias` en Visual Studio Code.
2. Usa Live Server para servir `index.html`. Si abre `127.0.0.1`, cambia esa dirección por `localhost` en el navegador conservando el puerto. Otra opción, si tienes Python instalado, es ejecutar `python -m http.server 5500` desde esta carpeta.
3. Abre `http://localhost:5500` (o el puerto indicado por Live Server).
4. Crea una cuenta gratuita en https://gnews.io/, verifica tu correo y copia tu API Key desde el panel.
5. En el portal, pulsa **Configurar API**, pega la clave y conecta. Busca, por ejemplo, `inteligencia artificial`.

La clave permanece únicamente en memoria durante esta pestaña. Es necesario introducirla otra vez al recargar. No se incluye ninguna clave ajena. El navegador envía la clave a GNews; una aplicación pública requeriría un backend para mantenerla privada.

La documentación consultada indica que el plan gratuito admite 100 consultas al día, hasta 10 artículos por consulta y noticias con 12 horas de retraso. CORS en este plan permite localhost: abrir el archivo con doble clic o publicarlo en otro dominio puede impedir las consultas. Revisa las condiciones vigentes en tu cuenta.

## Archivos

- `index.html`: estructura, encabezado, búsqueda, resultados y ventana para configurar la clave.
- `style.css`: diseño editorial, colores, tarjetas, adaptación móvil y tema oscuro.
- `script.js`: eventos, petición a GNews, validación, renderizado y manejo de errores.

Las imágenes son las que proporciona cada noticia de GNews. Se muestran sin sustituciones genéricas. Si el medio no tiene una imagen o no permite cargarla, aparece una alternativa gráfica propia con un mensaje explícito. La calidad de origen depende de cada medio; el portal no puede inventar una versión de mayor resolución. Las fuentes tipográficas usan Google Fonts con fuentes locales alternativas si no hay conexión.

## Antes de programar: conceptos y plan

Una **API REST** ofrece recursos a través de peticiones HTTP. Aquí se hace una petición GET para leer noticias. Un **endpoint** es una dirección específica del servicio; este proyecto usa `https://gnews.io/api/v4/search`. Sus parámetros indican el tema (`q`), idioma (`lang=es`), cantidad (`max=10`) y autenticación (`apikey`). **JSON** es un formato de datos: GNews devuelve un objeto con una lista `articles`, cuyos elementos contienen título, descripción, imagen, enlace, fecha y fuente.

El flujo planeado es: escribir tema → comprobar tema y clave → mostrar carga → construir URL → consultar GNews → comprobar respuesta → convertir JSON → crear tarjetas → mostrar resultados o un mensaje. Si falla la consulta, se muestra una explicación y se vuelve a habilitar el buscador.

## Cómo explicar el código

- **`async`** declara una función que devuelve una promesa y permite escribir operaciones asíncronas con `await`.
- **`await`** espera que una promesa termine dentro de esa función, sin bloquear toda la interfaz.
- **`fetch()`** realiza la petición HTTP y devuelve una promesa con un objeto Response.
- **`respuesta`** es ese objeto Response. `respuesta.ok` indica si el código HTTP está entre 200 y 299. Un HTTP 401 o 403 no hace que fetch rechace por sí solo: por eso se revisa explícitamente.
- **`.json()`** lee el cuerpo de la respuesta y lo convierte en datos JavaScript. También es asíncrono.
- **`try`** contiene la operación que puede fallar; **`catch`** recibe el error y presenta un mensaje útil.
- **`finally`** siempre restaura el botón y limpia el temporizador.
- **`URLSearchParams`** codifica los parámetros, incluidos espacios y acentos.
- **`AbortController`** cancela la petición si tarda más de 20 segundos.
- **`textContent`** inserta los textos de las noticias sin tratarlos como HTML. Los enlaces se validan para aceptar únicamente HTTP o HTTPS.

## Requisitos cubiertos

Encabezado, buscador, botón, área de resultados, mensaje de carga, ausencia de resultados y manejo de errores. Cada noticia muestra imagen o aviso de ausencia, título, descripción, fuente, fecha y enlace **Leer noticia** que abre el original en otra pestaña.

No hay noticias ficticias en la aplicación. Antes de conectar la API se muestra un estado inicial honesto.

## Actividad en Antigravity

La tarea exige una revisión real en Antigravity después de ejecutar la versión básica en Visual Studio Code. Esa actividad todavía debe hacerla el equipo; este documento no afirma que ya sucedió.

Para separar las etapas, se incluye una carpeta hermana `portal-noticias-base`, con el mismo consumo de API pero sin las reglas para móvil ni el control de tema oscuro. Ejecuta primero esa versión. Después abre esa carpeta en Antigravity y envía:

> Analiza este proyecto de noticias. No modifiques ningún archivo todavía. Explica cómo funciona, identifica posibles problemas y propón cinco mejoras.

Revisa sus cinco propuestas y selecciona solo dos. Las dos mejoras incluidas en la versión final como propuesta son **diseño responsivo** y **modo oscuro**. Si coinciden con las recomendaciones que seleccione el equipo, pide:

> Implementa únicamente diseño responsivo y modo oscuro. Antes de modificar los archivos explícame qué archivos vas a cambiar.

No inventes los números de las propuestas: utiliza los que devuelva Antigravity. Guarda sus respuestas y compara el resultado con esta versión final.

## Verificación manual con tu clave

1. Buscar un tema común: deben aparecer hasta 10 noticias reales.
2. Abrir **Leer noticia** y comprobar el medio de origen.
3. Consultar una palabra poco probable: debe aparecer el estado sin resultados si GNews no devuelve artículos.
4. Introducir una clave inválida: debe mostrarse un error comprensible.
5. Desconectar internet y buscar: el botón debe volver a habilitarse tras el error.
6. Probar ancho móvil y cambiar a modo oscuro.
7. Recargar: debe solicitarse la clave de nuevo.

## Fuentes técnicas

- Inicio y límites: https://docs.gnews.io/
- Endpoint: https://docs.gnews.io/endpoints/search-endpoint
- Errores HTTP: https://docs.gnews.io/error-handling
- Restricciones de navegador: https://gnews.io/faq

La conexión real no puede verificarse sin una API Key del equipo. Consulta `VERIFICACION.md` para distinguir las comprobaciones realizadas de las pendientes.
