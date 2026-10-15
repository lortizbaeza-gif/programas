# Práctica web de Unidad II

**Integrantes:** Genny Navarrete Aguilar, Diana Bojorques Cetina, Luisa Fernanda Ortiz Baeza y Alex Dionisio Rojas.

Los **12 ejercicios** se ejecutan en el navegador, incluido el juego de pintar coches. No requieren Python, bases de datos, cuenta ni instalaciones para abrir la versión local.

## Abrir en clase

1. Extrae toda la carpeta del RAR o ZIP.
2. Abre **ABRIR_WEB.html**, o abre **dist/index.html** directamente con Edge, Chrome o Firefox actualizado.
3. Elige cualquier ejercicio en el menú. Los resultados permanecen al cambiar de ejercicio dentro de la misma pestaña.
4. El juego tiene su propio botón Iniciar / reiniciar. Las llegadas continúan mientras la página está abierta, aunque cambies de sección.

No abras los archivos dentro de la vista previa del archivo comprimido: primero extrae la carpeta. Mantén index.html, styles.css, estructuras.js y app.js juntos dentro de dist/.

## Qué se incluye

- Listas: disponibles y retirados, pares/impares, aprobados/reprobados, compra ordenada y palabras por inicial.
- Pilas: inversión, palíndromo, suma de enteros grandes y reemplazo.
- Colas: banco, juego y estacionamiento circular doble.
- Código HTML, CSS y JavaScript organizado y comentado.
- 37 pruebas de estructuras, algoritmos y validaciones, ejecutables en el navegador.
- Documentación PDF con análisis y capturas reales de la versión web.

## Pruebas

Abre **pruebas/pruebas.html** con doble clic para ejecutar las 37 pruebas. Si tienes Node.js, también puedes ejecutar:

```text
node pruebas/ejecutar.cjs
```

BigInt aparece únicamente como referencia de comparación dentro de una prueba. El algoritmo de suma de la aplicación opera con pilas por dígito, acarreo y préstamo, sin convertir el número completo a Number ni BigInt.

## Archivos y estructuras

- `dist/estructuras.js`: Nodo, ListaDoble, Pila, Cola y ColaCircularDoble, validadores y algoritmos.
- `dist/app.js`: formularios, navegación, reglas de cada ejercicio, tablas y juego.
- `dist/styles.css`: diseño adaptable y estados visuales.
- `dist/index.html`: documento principal y carga de los scripts.
- `pruebas/`: pruebas sin dependencias externas.
- `evidencias/`: capturas de navegador y resultados de las pruebas.

Listas, pilas y colas utilizan nodos enlazados propios. Los arreglos de JavaScript se utilizan para presentar resultados o recorrer grupos; no sustituyen la estructura principal. El orden de productos se calcula por inserción sobre enlaces. El estacionamiento usa una cola FIFO circular doble real.

## Datos y validación

- La información de los ejercicios se conserva en memoria al navegar. **Recargar o cerrar la pestaña reinicia los registros.** No hay sincronización entre compañeros ni una base de datos.
- El récord de partidas terminadas del juego se guarda con localStorage en ese navegador. Si el navegador bloquea el almacenamiento, se conserva en la sesión y se muestra el aviso. El almacenamiento en archivos locales puede variar según el navegador.
- Los precios se convierten a centavos enteros. El total de compra se calcula sin errores de coma flotante.
- Banco y estacionamiento toman la fecha del equipo. La duración se mide con performance.now(), un reloj monotónico.
- El cobro es $2.00 por segundo con fracciones; el importe final se redondea a centavos.
- Los formularios validan campos vacíos, tipos y rangos. No hay operaciones bancarias reales: es una simulación académica.

## Interpretaciones de la consigna

- Se muestran aprobados y reprobados, corrigiendo la repetición del texto original. Se aprueba con 7 o más, en escala de 0 a 10.
- Reemplazar sustituye todas las apariciones de viejo por nuevo y conserva el orden.
- Productos aleatorios: de 1 a 50 unidades y precios de $1.00 a $500.00. Retirar mueve el registro completo.
- En compra, un registro representa una unidad; la clave es única sin distinguir mayúsculas.
- Las palabras se agrupan sin distinguir mayúsculas ni tildes en la inicial. Se conserva la escritura original.
- Palíndromos ignoran mayúsculas, tildes, espacios y signos.
- La suma admite hasta 10 000 dígitos por entrada, con signo opcional.
- Banco inicia con capacidad de cinco clientes; sólo se cambia estando vacío. Los turnos se asignan automáticamente.
- Juego: un coche inmediato y los siguientes cada 20 segundos. Cada tres aciertos reduce el intervalo dos segundos, hasta un mínimo de dos. El ritmo concreto se eligió porque el PDF no precisa cuánto debe aumentar. Sólo se pinta el frente. Un error conserva el coche y cinco en espera terminan la partida. El récord prioriza más aciertos y, en empate, menor tiempo. Reiniciar una partida incompleta no guarda ese resultado.

## Publicación y entrega

La carpeta dist/ se puede alojar en cualquier servidor estático. La aplicación no utiliza servicios externos ni conexiones a una API. La publicación de Sites conserva acceso privado; para mostrarla a la profesora sin depender de una cuenta, utiliza los archivos locales de este paquete.

La documentación y el código fuente se incluyen en RAR real y ZIP alternativo. La consigna original indica subir el trabajo por equipo a Teams el **viernes 23 de octubre de 2026**. No se ha realizado esa subida.
