from dataclasses import dataclass
from decimal import Decimal
from comun.estructuras import ListaDoble
from comun.interfaz import clave_texto

@dataclass
class Producto:
    clave: str
    nombre: str
    cantidad: int
    precio: Decimal

@dataclass
class Alumno:
    nombre: str
    calificacion: Decimal

class Inventario:
    def __init__(self, aleatorio):
        self.disponibles = ListaDoble(); self.retirados = ListaDoble()
        self.secuencia = 0; self.aleatorio = aleatorio
    def generar(self, cantidad):
        for _ in range(cantidad):
            self.secuencia += 1
            self.disponibles.agregar(Producto(str(self.secuencia), f'producto{self.secuencia}',
                self.aleatorio.randint(1, 50), Decimal(self.aleatorio.randint(100, 50000))/100))
    def retirar(self, clave):
        producto = self.disponibles.extraer(lambda p:p.clave == clave)
        if producto: self.retirados.agregar(producto)
        return producto

def separar_numeros(numeros):
    pares, impares = ListaDoble(), ListaDoble()
    for numero in numeros: (pares if numero % 2 == 0 else impares).agregar(numero)
    return pares, impares

class RegistroAlumnos:
    def __init__(self): self.aprobados = ListaDoble(); self.reprobados = ListaDoble()
    def agregar(self, nombre, calificacion):
        if not Decimal('0') <= calificacion <= Decimal('10'): raise ValueError('Calificación fuera de rango.')
        self.aprobados.agregar(Alumno(nombre, calificacion))
        # Extraer físicamente de la lista inicial los alumnos que reprueban.
        if calificacion < 7:
            self.reprobados.agregar(self.aprobados.extraer(lambda a: a.nombre == nombre and a.calificacion == calificacion))

class Compra:
    def __init__(self): self.productos = ListaDoble()
    def agregar(self, clave, nombre, precio):
        clave = clave.strip().upper()
        if self.productos.buscar(lambda p:p.clave == clave): raise ValueError('La clave ya existe.')
        if precio < 0: raise ValueError('El precio no puede ser negativo.')
        self.productos.agregar(Producto(clave, nombre, 1, precio))
    def eliminar(self, clave): return self.productos.extraer(lambda p:p.clave == clave.strip().upper())
    def ordenar(self): self.productos.ordenar(lambda p:clave_texto(p.nombre))
    def total(self): return sum((p.precio for p in self.productos), Decimal('0'))

class Palabras:
    def __init__(self): self.original = ListaDoble(); self.grupos = {}
    def agregar(self, palabra):
        if not palabra.isalpha(): raise ValueError('Escribe una sola palabra, sólo con letras.')
        inicial = clave_texto(palabra[0]).upper()
        self.original.agregar(palabra)
        if inicial not in self.grupos: self.grupos[inicial] = ListaDoble()
        self.grupos[inicial].agregar(palabra)
