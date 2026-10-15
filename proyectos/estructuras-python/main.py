"""Menú general opcional. Cada proyecto también tiene su propio main.py."""
from comun.interfaz import menu,ejecutar
from listas.main import AplicacionListas
from pilas.main import AplicacionPilas
from colas.main import AplicacionColas

def principal():
    proyectos=[AplicacionListas(),AplicacionPilas(),AplicacionColas()]
    while True:
        op=menu('UNIDAD II - ESTRUCTURAS DE DATOS',['Proyecto de listas (5 ejercicios)','Proyecto de pilas (4 ejercicios)','Proyecto de colas (3 ejercicios)'])
        if op==0:return
        proyectos[op-1].ejecutar()

if __name__=='__main__':ejecutar(principal)
