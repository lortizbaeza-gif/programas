# Práctica de Unidad II: Estructuras de datos

**Integrantes:** Genny Navarrete Aguilar, Diana Bojorques Cetina, Luisa Fernanda Ortiz Baeza y Alex Dionisio Rojas.

Incluye **12 ejercicios** organizados en tres proyectos. Once se manejan desde consola y el juego de pintar coches abre una ventana con Tkinter.

## Cómo abrir

1. Descomprime el paquete completo en una carpeta con permiso de escritura.
2. Instala Python **3.10 o superior**, incluyendo Tcl/Tk y agregándolo al PATH.
3. En Windows, abre `Iniciar.cmd`. También puedes ejecutar `python main.py`.
4. Elige Listas, Pilas o Colas. Dentro de cada proyecto selecciona el ejercicio.
5. Usa **0** para volver. Los datos de los menús se conservan mientras siga abierto el programa.

Los proyectos también se ejecutan de forma independiente, desde la raíz:

```text
python listas/main.py
python pilas/main.py
python colas/main.py
python colas/juego.py
```

No requieren instalar bibliotecas con pip. Los registros de consola viven en memoria; el récord del juego se guarda en `datos/record_coches.json` al finalizar una partida. Reiniciar o cerrar una partida incompleta no guarda ese resultado.

## Ejercicios incluidos

| Proyecto | Ejercicios |
|---|---|
| Listas | Productos disponibles y retirados; pares e impares; aprobados y reprobados; eliminar y ordenar productos; palabras por inicial |
| Pilas | Invertir palabra; palíndromo; suma de enteros grandes; reemplazar valor |
| Colas | Ventanilla de banco; juego visual de pintar coches; estacionamiento con cola circular doblemente ligada |

## Decisiones e interpretaciones

- Las listas, pilas y colas tienen nodos propios. `list()` sólo se utiliza para mostrar datos; no sustituye el almacenamiento enlazado. La agrupación de palabras usa un diccionario de listas enlazadas.
- Productos aleatorios: cantidad de 1 a 50 unidades y precio de $1.00 a $500.00. Son rangos elegidos porque el documento no fija límites. Retirar mueve el producto completo a la lista de retirados. Se muestran registros y unidades.
- Calificaciones de 0 a 10 con decimales. Menor de 7 reprueba; 7 o más aprueba. Se corrige la repetición de “aprobaron” del enunciado mostrando ambas listas.
- Productos de compra: cada registro corresponde a una unidad, clave única, precios de hasta dos decimales y suma exacta con `Decimal`.
- Palabras: una palabra de letras, con inicial sin distinguir mayúsculas ni tildes. Se permite repetir una palabra. Una inicial nueva crea su lista automáticamente.
- Palíndromos: se ignoran mayúsculas, tildes, espacios y signos. Se aceptan palabras, números o frases.
- Suma grande: admite signo positivo o negativo y hasta 10 000 dígitos por entrada en la consola. Usa pilas por dígito, acarreo o préstamo; no convierte el número completo a `int` ni usa la suma de enteros grandes del lenguaje.
- Reemplazar interpreta el enunciado ambiguo como **sustituir todas las apariciones de viejo por nuevo**, conservando el orden. Firma: `Reemplazar(pila, nuevo, viejo)`.
- Banco: capacidad inicial de cinco clientes, modificable únicamente con la cola vacía; turnos automáticos consecutivos. El comboBox y la tabla de la consigna se adaptan a menú numérico y tabla de consola, según lo solicitado. Frente y final muestran números de turno.
- Juego: comienza con un coche para poder jugar de inmediato. Las siguientes llegadas ocurren cada 20 segundos; cada tres aciertos se reduce el intervalo en dos segundos, hasta un mínimo de dos. Esta progresión es una elección porque el PDF no precisa cuánto aumenta la velocidad. Un error de color no retira el coche. Sólo se atiende el frente. Termina al haber cinco coches. El récord prioriza mayor cantidad pintada y, en empate, menor tiempo.
- Estacionamiento: FIFO, capacidad lógica ilimitada, cola circular doble enlazada real, sin placas duplicadas. Se cobra $2.00 por segundo transcurrido, incluyendo fracciones, y se redondea el importe final a centavos. Se capturan las fechas del sistema y se usa un reloj monotónico para la duración, evitando cambios del reloj del sistema.
- El valor genérico de “entradas numérico decimal” se aplica a precios y calificaciones; los textos y enteros se validan conforme al tipo requerido por cada ejercicio.

## Pruebas

Desde la carpeta principal:

```text
python -m unittest discover -s pruebas -v
```

La documentación en PDF incluye análisis de entrada, proceso y salida para cada ejercicio, instrucciones, evidencias y resultados de validación.

## Entrega

El documento original solicita un archivo RAR con el proyecto y el PDF. Se entregan un **RAR real (formato RAR 5, método almacenar)** y un ZIP alternativo con el mismo contenido. Ambos incluyen esta carpeta completa y la documentación. El RAR se verificó mediante extracción y comparación de los archivos. No es un ZIP con la extensión cambiada.

No se incluye una subida a Teams. La entrega indicada en la consigna es el viernes **23 de octubre de 2026**.
