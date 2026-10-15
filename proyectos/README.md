# Proyectos de programación

La aplicación Claro del clima permanece en `dist/` y su documentación en el README de la raíz.

- [cine](./cine/): Aplicación ASP.NET Core para cine. Se omitieron bin, obj y cine.db. Configura ConnectionStrings__DefaultConnection en tu entorno antes de ejecutar dotnet run. El código se copia del proyecto local; no se ejecutó ni se migró la base de datos en esta recopilación.
- [jaguares-portal](./jaguares-portal/): Solo se encontró el código del portal web (wwwroot) del paquete local jaguares.Host. No contiene el código fuente del servidor ASP.NET; requiere el backend original para las rutas /api/. Se excluyeron las cargas de usuarios, las configuraciones del servidor y sus ejecutables.
- [gestnutri](./gestnutri/): Copia del repositorio descargado de https://github.com/jilderdionisio-cloud/GestNutri. Se conserva la atribución al proyecto y equipo originales; esta copia no implica autoría exclusiva. Consulta README.md para su arquitectura y ejecución.
- [nutrigest](./nutrigest/): Base de proyecto NutriGest con frontend React y backend Django. Consulta README.md. Se excluyeron dependencias instaladas, archivos .env y builds del frontend.
- [colas-csharp](./colas-csharp/): Ejemplos de colas en C#. Abre EjemplosCola.sln con Visual Studio o ejecuta dotnet run --project EjemplosCola/EjemplosCola.csproj.
- [portal-noticias](./portal-noticias/): Portal de noticias. Consulta LEEME.md. La clave de API debe proporcionarse en tiempo de ejecución; no se incluye una clave personal.
- [estructuras-python](./estructuras-python/): Prácticas de listas, pilas y colas en Python. Ejecuta python main.py desde esta carpeta. Se incluyen las pruebas del proyecto.
- [estructuras-web](./estructuras-web/): Versión web de las prácticas de estructuras de datos. Abre dist/index.html. Consulta LEEME.md.
- [estructuras-javascript](./estructuras-javascript/): Ejemplos de estructuras y listas en JavaScript. Ejecuta cada archivo .mjs con Node.js.

No se incluyen documentos escolares independientes, presentaciones, bases de datos locales, cargas de usuarios, secretos ni historiales .git. Los proyectos se agregan como copias del estado encontrado, sin inventar commits históricos.
