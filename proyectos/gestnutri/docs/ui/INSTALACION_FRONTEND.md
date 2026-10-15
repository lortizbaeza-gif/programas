# Instalación y conexión local

Node compatible con Vite 7 (20.19+ o 22.12+); verificado con Node 24.18.0.
Desde frontend/:

```powershell
npm ci
npm test
npm run build
npm run dev
```

El modo predeterminado es mock. Para conectar al backend de PR #9:

```powershell
$env:VITE_DATA_MODE = 'api'
npm run dev
```

Alternativamente copiar .env.example a .env.local y cambiar VITE_DATA_MODE a api. Reiniciar Vite al cambiar de modo. Abrir la dirección 127.0.0.1 indicada por Vite.

Ejecutar previamente el backend con PostgreSQL y una cuenta ficticia siguiendo docs/api/INTEGRACION_LOCAL_S1.md en la rama feature/HU-01-backend-base (PR #9). No se requiere fusionar ramas. No usar la base de producción ni datos reales.

vite.config.js envía /api al backend local http://127.0.0.1:8000 con changeOrigin:false. El navegador siempre usa rutas relativas del mismo origen; no se habilita CORS. Este proxy pertenece al servidor de desarrollo: npm run preview y un despliegue requieren su propia configuración de proxy, no usar preview para esta prueba.

No se usa VITE_API_BASE_URL: la guía establece proxy y mismo origen. No colocar secretos en variables VITE_*. Las credenciales se introducen en el formulario y no se persisten en storage ni archivos. Las cookies de sesión las administra Django; CSRF se mantiene en memoria y se renueva tras login o recarga.

npm test ejecuta siete pruebas del adaptador/validaciones, sin DOM ni red real. La comprobación manual en navegador se registra en INTEGRACION_S1.md. Sin backend el modo API mostrará un error; se puede ejecutar el modo mock para trabajar sin dependencias.
