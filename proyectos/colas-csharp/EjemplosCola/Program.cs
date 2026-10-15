// Permite usar Console para mostrar resultados en la consola.
using System;
// Permite usar colecciones genéricas de .NET, como Queue<T>.
using System.Collections.Generic;

// Agrupa las clases de este ejemplo bajo un mismo nombre.
namespace EjemplosCola
{
    // CLASE PARAMETRIZADA O GENÉRICA:
    // T es un parámetro de tipo: representa el tipo de dato de los elementos.
    // Al escribir ColaGenerica<string>, T se sustituye por string.
    // Al escribir ColaGenerica<int>, T se sustituye por int.
    // Así reutilizamos la misma clase con distintos tipos y conservamos
    // la comprobación de tipos durante la compilación.
    // public permite usar esta clase desde otras partes del programa.
    public class ColaGenerica<T>
    {
        // Queue<T> almacena los elementos en orden FIFO:
        // First In, First Out = primero en entrar, primero en salir.
        // private impide acceder directamente a esta cola desde fuera de la clase.
        // readonly impide asignar otra cola a este campo; sus elementos sí cambian.
        // new crea una instancia (un objeto) de Queue<T>, inicialmente vacía.
        private readonly Queue<T> elementos = new Queue<T>();

        // Recibe un elemento del tipo T y lo agrega al final de la cola.
        // void indica que el método no devuelve un resultado.
        public void Enqueue(T elemento)
        {
            elementos.Enqueue(elemento);
        }

        // Quita el elemento del frente y lo devuelve al código que llamó al método.
        // T antes del nombre indica que el resultado es del tipo elegido.
        public T Dequeue()
        {
            return elementos.Dequeue();
        }

        // Devuelve el elemento del frente para consultarlo, sin quitarlo.
        public T Peek()
        {
            return elementos.Peek();
        }

        // Propiedad de solo lectura que devuelve la cantidad de elementos.
        // => es una forma abreviada de escribir el cuerpo de esta propiedad.
        public int Count => elementos.Count;

        // Dequeue y Peek lanzan InvalidOperationException si la cola está vacía.
        // En estos ejemplos siempre hay elementos antes de llamarlos.
    }

    // Contiene el punto de entrada del programa.
    // internal permite usar esta clase dentro del mismo proyecto compilado.
    internal class Program
    {
        // Main se ejecuta cuando inicia la aplicación de consola.
        // static permite ejecutarlo sin crear un objeto Program.
        // void indica que no devuelve un valor.
        // args contiene los argumentos recibidos desde la línea de comandos.
        static void Main(string[] args)
        {
            // EJEMPLO 1: colección genérica que ya proporciona .NET.
            // Console.WriteLine muestra un texto o valor y termina la línea.
            Console.WriteLine("Ejemplo con Queue<string>:");
            // string es el argumento de tipo: esta cola solo acepta cadenas.
            // La izquierda declara la variable; la derecha crea el objeto.
            Queue<string> cola = new Queue<string>();
            cola.Enqueue("Ana");      // Cola: Ana.
            cola.Enqueue("Luis");     // Cola: Ana, Luis.
            cola.Enqueue("Fernanda"); // Cola: Ana, Luis, Fernanda.
            Console.WriteLine(cola.Dequeue()); // Imprime Ana y la elimina.
            Console.WriteLine(cola.Peek());    // Imprime Luis sin eliminarlo.
            Console.WriteLine(cola.Count);     // Imprime 2: quedan Luis y Fernanda.

            // EJEMPLO 2: instancia de nuestra propia clase genérica con string.
            // \n agrega un salto de línea para separar los ejemplos.
            Console.WriteLine("\nEjemplo con ColaGenerica<string>:");
            // Aquí T es string: los métodos reciben y devuelven cadenas.
            // Es un objeto nuevo con su propia cola, independiente del anterior.
            ColaGenerica<string> colaNombres = new ColaGenerica<string>();
            colaNombres.Enqueue("Ana");      // Agrega la primera persona.
            colaNombres.Enqueue("Luis");     // Agrega la segunda persona.
            colaNombres.Enqueue("Fernanda"); // Agrega la tercera persona.
            Console.WriteLine(colaNombres.Dequeue()); // Imprime y quita Ana.
            Console.WriteLine(colaNombres.Peek());    // Consulta Luis: sigue en la cola.
            Console.WriteLine(colaNombres.Count);     // Imprime 2.

            // EJEMPLO 3: misma clase genérica, distinto argumento de tipo.
            Console.WriteLine("\nLa misma clase con int:");
            // Aquí T es int: esta instancia guarda números enteros.
            // No necesitamos escribir otra clase para trabajar con números.
            ColaGenerica<int> colaNumeros = new ColaGenerica<int>();
            colaNumeros.Enqueue(10); // Cola: 10.
            colaNumeros.Enqueue(20); // Cola: 10, 20.
            Console.WriteLine(colaNumeros.Dequeue()); // Imprime y quita 10.
            Console.WriteLine(colaNumeros.Peek());    // Imprime 20 sin quitarlo.
            Console.WriteLine(colaNumeros.Count);     // Imprime 1: queda 20.

            // Ejemplo de seguridad de tipos (comentado para que el programa compile):
            // colaNumeros.Enqueue("Ana");
            // Produciría un error de compilación: esta instancia requiere int.

            // Aplicación práctica: atender personas o procesar tareas en orden de llegada.
            // La clase define el comportamiento; T permite elegir qué datos almacena.
        }
    }
}
