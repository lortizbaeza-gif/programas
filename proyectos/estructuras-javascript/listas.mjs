export class Nodo {
  constructor(dato) { this.dato = dato; this.ant = null; this.sig = null; }
}
export class ListaDoble {
  constructor(circular = false) {
    this.circular = circular; this.cabeza = null; this.cola = null; this.tamano = 0;
  }
  cerrar() {
    if (this.cabeza) {
      this.cabeza.ant = this.circular ? this.cola : null;
      this.cola.sig = this.circular ? this.cabeza : null;
    }
  }
  insertarInicio(dato) {
    const n = new Nodo(dato);
    if (!this.cabeza) this.cabeza = this.cola = n;
    else { n.sig = this.cabeza; this.cabeza.ant = n; this.cabeza = n; }
    this.tamano++; this.cerrar(); return n;
  }
  insertarFinal(dato) {
    const n = new Nodo(dato);
    if (!this.cola) this.cabeza = this.cola = n;
    else { n.ant = this.cola; this.cola.sig = n; this.cola = n; }
    this.tamano++; this.cerrar(); return n;
  }
  buscar(dato) {
    let n = this.cabeza;
    for (let i = 0; i < this.tamano; i++, n = n.sig) if (n.dato === dato) return n;
    return null;
  }
  insertarDespues(valor, dato) {
    const a = this.buscar(valor);
    if (!a) return null;
    if (a === this.cola) return this.insertarFinal(dato);
    const n = new Nodo(dato), b = a.sig;
    n.ant = a; n.sig = b; a.sig = n; b.ant = n; this.tamano++; return n;
  }
  eliminar(dato) {
    const n = this.buscar(dato);
    if (!n) return false;
    if (this.tamano === 1) this.cabeza = this.cola = null;
    else {
      if (n.ant) n.ant.sig = n.sig;
      if (n.sig) n.sig.ant = n.ant;
      if (n === this.cabeza) this.cabeza = n.sig;
      if (n === this.cola) this.cola = n.ant;
    }
    n.ant = n.sig = null; this.tamano--; this.cerrar(); return true;
  }
  recorrer(inverso = false) {
    const resultado = []; let n = inverso ? this.cola : this.cabeza;
    for (let i = 0; i < this.tamano; i++) { resultado.push(n.dato); n = inverso ? n.ant : n.sig; }
    return resultado;
  }
}
