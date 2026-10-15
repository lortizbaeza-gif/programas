"""Ejecutar: python listas/main.py (desde cualquier carpeta)."""
if __package__ in (None, ''):
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import random
from decimal import Decimal
from comun.interfaz import menu, entero, decimal, texto, tabla, ejecutar
from comun.estructuras import ListaDoble
from listas.modelos import Inventario, separar_numeros, RegistroAlumnos, Compra, Palabras

def mostrar_productos(productos):
    tabla(['Clave','Nombre','Cantidad','Precio'], ((p.clave,p.nombre,p.cantidad,f'${p.precio:.2f}') for p in productos))

class AplicacionListas:
    def __init__(self):
        self.inventario = Inventario(random.Random()); self.numeros = ListaDoble()
        self.alumnos = RegistroAlumnos(); self.compra = Compra(); self.palabras = Palabras()
    def productos(self):
        while True:
            op = menu('L1. Productos disponibles y retirados', ['Generar productos','Retirar por clave','Mostrar disponibles y retirados'])
            if op == 0: return
            if op == 1:
                self.inventario.generar(entero('Cantidad de productos nuevos (1-100): ',1,100)); print('Productos agregados.')
            if op == 2:
                if not len(self.inventario.disponibles): print('No hay productos disponibles.'); continue
                p = self.inventario.retirar(texto('Clave a retirar: ')); print('Producto retirado.' if p else 'La clave no existe entre los disponibles.')
            print('DISPONIBLES'); mostrar_productos(self.inventario.disponibles)
            print('RETIRADOS'); mostrar_productos(self.inventario.retirados)
            print(f'Registros disponibles: {len(self.inventario.disponibles)} | retirados: {len(self.inventario.retirados)}')
            print(f'Unidades disponibles: {sum(p.cantidad for p in self.inventario.disponibles)} | retiradas: {sum(p.cantidad for p in self.inventario.retirados)}')
    def pares(self):
        while True:
            op=menu('L2. Pares e impares',['Generar lista aleatoria nueva','Mostrar clasificación actual'])
            if op==0:return
            if op==1:
                n=entero('Cantidad de números (1-1000): ',1,1000)
                minimo=entero('Mínimo: ',-1000000,1000000); maximo=entero('Máximo: ',minimo,1000000)
                self.numeros=ListaDoble()
                for _ in range(n):self.numeros.agregar(random.randint(minimo,maximo))
            pares,impares=separar_numeros(self.numeros)
            print('Original:',list(self.numeros)); print('Pares:',list(pares)); print('Impares:',list(impares))
    def calificaciones(self):
        while True:
            op=menu('L3. Aprobados y reprobados',['Registrar alumno','Mostrar las dos listas'])
            if op==0:return
            if op==1:
                nombre=texto('Nombre del alumno: '); nota=decimal('Calificación (0-10): ',Decimal('0'),Decimal('10'))
                self.alumnos.agregar(nombre,nota);print('Alumno registrado y clasificado.')
            print('APROBADOS (7 o más)');tabla(['Nombre','Calificación'],((a.nombre,a.calificacion) for a in self.alumnos.aprobados))
            print('REPROBADOS (menos de 7)');tabla(['Nombre','Calificación'],((a.nombre,a.calificacion) for a in self.alumnos.reprobados))
    def compras(self):
        while True:
            op=menu('L4. Eliminar y ordenar productos',['Agregar producto','Eliminar por clave','Ordenar por nombre y ver total'])
            if op==0:return
            if op==1:
                clave=texto('Clave única: ',20).upper()
                if self.compra.productos.buscar(lambda p:p.clave==clave):print('La clave ya existe.');continue
                self.compra.agregar(clave,texto('Nombre del producto: '),decimal('Precio: $',dinero=True))
            if op==2:
                if not len(self.compra.productos):print('La compra está vacía.');continue
                print('Producto eliminado.' if self.compra.eliminar(texto('Clave a eliminar: ')) else 'La clave no existe.')
            self.compra.ordenar();mostrar_productos(self.compra.productos);print(f'TOTAL DE COMPRA: ${self.compra.total():.2f}')
    def clasificar_palabras(self):
        while True:
            op=menu('L5. Listar palabras por letra',['Agregar palabra','Mostrar listas por inicial'])
            if op==0:return
            if op==1:
                try:self.palabras.agregar(texto('Palabra: '))
                except ValueError as error:print(error);continue
            print('Lista original:',', '.join(self.palabras.original) or '(vacía)')
            for inicial,grupo in sorted(self.palabras.grupos.items()):print(f'Lista {inicial}: '+', '.join(grupo))
    def ejecutar(self):
        acciones=[self.productos,self.pares,self.calificaciones,self.compras,self.clasificar_palabras]
        while True:
            op=menu('PRÁCTICA DE LISTAS',['Productos disponibles y retirados','Pares e impares','Aprobados y reprobados','Eliminar y ordenar productos','Listar palabras por letra'])
            if op==0:return
            acciones[op-1]()

if __name__=='__main__':ejecutar(AplicacionListas().ejecutar)
