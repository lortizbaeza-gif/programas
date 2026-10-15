"""Entrada validada y tablas para consola. No necesita paquetes externos."""
import re
import unicodedata
from decimal import Decimal, InvalidOperation

def titulo(nombre):
    print('\n' + '=' * 76 + '\n' + nombre + '\n' + '=' * 76)

def texto(mensaje, maximo=80):
    while True:
        valor = unicodedata.normalize('NFC', input(mensaje).strip())
        if not valor: print('Hay datos faltantes. Escribe un texto.'); continue
        if len(valor) > maximo: print(f'Máximo {maximo} caracteres.'); continue
        if any(unicodedata.category(c).startswith('C') for c in valor):
            print('No se permiten caracteres de control.'); continue
        return valor

def entero(mensaje, minimo=None, maximo=None):
    while True:
        valor = input(mensaje).strip()
        if not re.fullmatch(r'[+-]?[0-9]+', valor):
            print('Introducir sólo números enteros.'); continue
        if len(valor.lstrip('+-')) > 100:
            print('El número es demasiado largo para esta opción.'); continue
        numero = int(valor)
        if minimo is not None and numero < minimo: print(f'El mínimo es {minimo}.'); continue
        if maximo is not None and numero > maximo: print(f'El máximo es {maximo}.'); continue
        return numero

def decimal(mensaje, minimo=Decimal('0'), maximo=Decimal('1000000000'), dinero=False):
    while True:
        valor = input(mensaje).strip().replace(',', '.')
        if not re.fullmatch(r'[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)', valor):
            print('Introducir sólo números. Usa punto o coma decimal, sin separadores de miles.'); continue
        try: numero = Decimal(valor)
        except InvalidOperation: print('Número inválido.'); continue
        if not numero.is_finite() or not minimo <= numero <= maximo:
            print(f'El valor debe estar entre {minimo} y {maximo}.'); continue
        if dinero and numero.as_tuple().exponent < -2:
            print('El precio admite como máximo dos decimales.'); continue
        return numero

def menu(nombre, opciones):
    titulo(nombre)
    for i, opcion in enumerate(opciones, 1): print(f'{i}. {opcion}')
    print('0. Volver / salir')
    return entero('Opción: ', 0, len(opciones))

def tabla(encabezados, filas):
    filas = [[str(c) for c in fila] for fila in filas]
    if not filas: print('(Sin registros)'); return
    anchos = [min(36, max(len(str(h)), *(len(f[i]) for f in filas))) for i,h in enumerate(encabezados)]
    def mostrar(fila):
        print(' | '.join((str(c) if len(str(c)) <= a else str(c)[:a-3]+'...').ljust(a) for c,a in zip(fila, anchos)))
    mostrar(encabezados); print('-+-'.join('-'*a for a in anchos))
    for fila in filas: mostrar(fila)

def clave_texto(valor):
    return ''.join(c for c in unicodedata.normalize('NFD', valor.casefold()) if not unicodedata.combining(c))

def ejecutar(funcion):
    try: funcion()
    except (EOFError, KeyboardInterrupt): print('\nPrograma finalizado. Hasta luego.')
