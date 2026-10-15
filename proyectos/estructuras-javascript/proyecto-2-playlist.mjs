import { ListaDoble } from './listas.mjs';
class Reproductor {
  constructor(canciones) {
    this.lista = new ListaDoble(true);
    for (const cancion of canciones) this.lista.insertarFinal(cancion);
    this.actual = this.lista.cabeza;
  }
  mostrar() { return this.actual?.dato ?? 'Sin canciones'; }
  siguiente() { if (this.actual) this.actual = this.actual.sig; return this.mostrar(); }
  anterior() { if (this.actual) this.actual = this.actual.ant; return this.mostrar(); }
}
const reproductor = new Reproductor(['Mar', 'Sol', 'Luna']);
console.log('Inicio:', reproductor.mostrar());
console.log('Siguiente:', reproductor.siguiente());
console.log('Siguiente:', reproductor.siguiente());
console.log('Siguiente, vuelve al inicio:', reproductor.siguiente());
console.log('Anterior, vuelve al último:', reproductor.anterior());
console.log('Lista vacía:', new Reproductor([]).mostrar());
