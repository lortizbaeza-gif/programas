import { ListaDoble } from './listas.mjs';
for (const circular of [false, true]) {
  console.log('\nLISTA', circular ? 'CIRCULAR DOBLE' : 'DOBLE LINEAL');
  const lista = new ListaDoble(circular);
  lista.insertarFinal(10); lista.insertarFinal(30); lista.insertarInicio(5);
  lista.insertarDespues(10, 20);
  console.log('Adelante:', lista.recorrer());
  console.log('Atrás:', lista.recorrer(true));
  console.log('Buscar 20:', lista.buscar(20)?.dato);
  lista.eliminar(20);
  console.log('Eliminar 20:', lista.recorrer());
}
