"""Implementaciones enlazadas: listas, pilas, colas y cola circular doble."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Callable, Generic, Iterator, TypeVar

T = TypeVar('T')

@dataclass(eq=False)
class Nodo(Generic[T]):
    dato: T
    anterior: Nodo[T] | None = None
    siguiente: Nodo[T] | None = None

class ListaDoble(Generic[T]):
    def __init__(self):
        self.cabeza = self.cola = None
        self.cantidad = 0

    def __len__(self): return self.cantidad

    def __iter__(self) -> Iterator[T]:
        actual = self.cabeza
        while actual is not None:
            yield actual.dato
            actual = actual.siguiente

    def agregar(self, dato: T):
        nuevo = Nodo(dato, anterior=self.cola)
        if self.cola is None: self.cabeza = nuevo
        else: self.cola.siguiente = nuevo
        self.cola = nuevo
        self.cantidad += 1
        return nuevo

    def buscar(self, condicion: Callable[[T], bool]):
        return next((dato for dato in self if condicion(dato)), None)

    def extraer(self, condicion: Callable[[T], bool]):
        actual = self.cabeza
        while actual is not None:
            if condicion(actual.dato):
                if actual.anterior: actual.anterior.siguiente = actual.siguiente
                else: self.cabeza = actual.siguiente
                if actual.siguiente: actual.siguiente.anterior = actual.anterior
                else: self.cola = actual.anterior
                self.cantidad -= 1
                actual.anterior = actual.siguiente = None
                return actual.dato
            actual = actual.siguiente
        return None

    def ordenar(self, clave: Callable[[T], object]):
        """Inserción estable sobre enlaces; no convierte a list ni usa sorted."""
        ordenada = ListaDoble[T]()
        actual = self.cabeza
        while actual:
            siguiente = actual.siguiente
            actual.anterior = actual.siguiente = None
            punto = ordenada.cabeza
            while punto is not None and clave(punto.dato) <= clave(actual.dato):
                punto = punto.siguiente
            if punto is None:
                actual.anterior = ordenada.cola
                if ordenada.cola: ordenada.cola.siguiente = actual
                else: ordenada.cabeza = actual
                ordenada.cola = actual
            else:
                actual.siguiente, actual.anterior = punto, punto.anterior
                if punto.anterior: punto.anterior.siguiente = actual
                else: ordenada.cabeza = actual
                punto.anterior = actual
            ordenada.cantidad += 1
            actual = siguiente
        self.cabeza, self.cola, self.cantidad = ordenada.cabeza, ordenada.cola, ordenada.cantidad

@dataclass
class NodoSimple(Generic[T]):
    dato: T
    siguiente: NodoSimple[T] | None = None

class Pila(Generic[T]):
    def __init__(self): self.cima = None; self.cantidad = 0
    def __len__(self): return self.cantidad
    def vacia(self): return self.cima is None
    def apilar(self, dato: T):
        self.cima = NodoSimple(dato, self.cima); self.cantidad += 1
    def desapilar(self) -> T:
        if self.vacia(): raise IndexError('La pila está vacía.')
        dato = self.cima.dato; self.cima = self.cima.siguiente; self.cantidad -= 1
        return dato
    def ver(self):
        if self.vacia(): raise IndexError('La pila está vacía.')
        return self.cima.dato
    def __iter__(self):
        actual = self.cima
        while actual:
            yield actual.dato; actual = actual.siguiente

class Cola(Generic[T]):
    def __init__(self, capacidad: int | None = None):
        if capacidad is not None and capacidad < 1: raise ValueError('Capacidad inválida.')
        self.frente = self.final = None; self.cantidad = 0; self.capacidad = capacidad
    def __len__(self): return self.cantidad
    def ColaVacia(self): return self.frente is None
    def ColaLlena(self): return self.capacidad is not None and self.cantidad >= self.capacidad
    def InsertaCola(self, dato: T):
        if self.ColaLlena(): raise OverflowError('La cola está llena. No se agregó el cliente.')
        nuevo = NodoSimple(dato)
        if self.final: self.final.siguiente = nuevo
        else: self.frente = nuevo
        self.final = nuevo; self.cantidad += 1
    def EliminaCola(self) -> T:
        if self.ColaVacia(): raise IndexError('La cola está vacía.')
        dato = self.frente.dato; self.frente = self.frente.siguiente; self.cantidad -= 1
        if self.frente is None: self.final = None
        return dato
    def primero(self):
        if self.ColaVacia(): raise IndexError('La cola está vacía.')
        return self.frente.dato
    def __iter__(self):
        actual = self.frente
        while actual:
            yield actual.dato; actual = actual.siguiente

class ColaCircularDoble(Generic[T]):
    """Cola FIFO sin capacidad fija. El frente y el final cierran el círculo."""
    def __init__(self): self.frente = self.final = None; self.cantidad = 0
    def __len__(self): return self.cantidad
    def ColaVacia(self): return self.frente is None
    def ColaLlena(self): return False  # Sin límite lógico de cupo.
    def InsertaCola(self, dato: T):
        nuevo = Nodo(dato)
        if self.ColaVacia():
            nuevo.anterior = nuevo.siguiente = nuevo
            self.frente = self.final = nuevo
        else:
            nuevo.anterior, nuevo.siguiente = self.final, self.frente
            self.final.siguiente = nuevo; self.frente.anterior = nuevo; self.final = nuevo
        self.cantidad += 1
    def EliminaCola(self) -> T:
        if self.ColaVacia(): raise IndexError('El estacionamiento está vacío.')
        nodo = self.frente
        if self.cantidad == 1: self.frente = self.final = None
        else:
            self.frente = nodo.siguiente
            self.frente.anterior = self.final; self.final.siguiente = self.frente
        nodo.anterior = nodo.siguiente = None; self.cantidad -= 1
        return nodo.dato
    def primero(self):
        if self.ColaVacia(): raise IndexError('El estacionamiento está vacío.')
        return self.frente.dato
    def __iter__(self):
        actual = self.frente
        for _ in range(self.cantidad):
            yield actual.dato; actual = actual.siguiente
