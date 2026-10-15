import re
import unicodedata
from comun.estructuras import Pila

def invertir(palabra):
    pila=Pila()
    for letra in unicodedata.normalize('NFC',palabra):pila.apilar(letra)
    resultado=[]
    while not pila.vacia():resultado.append(pila.desapilar())
    return ''.join(resultado)

def normalizar_palindromo(palabra):
    descompuesta=unicodedata.normalize('NFD',palabra.casefold())
    return ''.join(c for c in descompuesta if c.isalnum())

def es_palindromo(palabra):
    normalizada=normalizar_palindromo(palabra)
    if not normalizada:raise ValueError('Incluye al menos una letra o un número.')
    return normalizada==invertir(normalizada)

def _numero(valor):
    if not re.fullmatch(r'[+-]?[0-9]+',valor):raise ValueError('Introduce un entero, sin puntos ni espacios.')
    signo=-1 if valor.startswith('-') else 1
    magnitud=valor.lstrip('+-').lstrip('0') or '0'
    return (1 if magnitud=='0' else signo),magnitud

def _pila_digitos(numero):
    pila=Pila()
    for digito in numero:pila.apilar(ord(digito)-48)
    return pila

def _sumar_magnitudes(a,b):
    p,q=_pila_digitos(a),_pila_digitos(b)
    resultado=Pila();acarreo=0
    while not p.vacia() or not q.vacia() or acarreo:
        suma=(p.desapilar() if not p.vacia() else 0)+(q.desapilar() if not q.vacia() else 0)+acarreo
        resultado.apilar(suma%10);acarreo=suma//10
    return ''.join(str(resultado.desapilar()) for _ in range(len(resultado)))

def _restar_magnitudes(mayor,menor):
    p,q=_pila_digitos(mayor),_pila_digitos(menor)
    resultado=Pila();prestamo=0
    while not p.vacia():
        diferencia=p.desapilar()-prestamo-(q.desapilar() if not q.vacia() else 0)
        prestamo=1 if diferencia<0 else 0
        resultado.apilar(diferencia+10 if diferencia<0 else diferencia)
    return ''.join(str(resultado.desapilar()) for _ in range(len(resultado))).lstrip('0') or '0'

def sumar_grandes(primero,segundo):
    """Suma con signo usando pilas de dígitos; nunca convierte el entero completo."""
    sa,a=_numero(primero);sb,b=_numero(segundo)
    if sa==sb:
        resultado=_sumar_magnitudes(a,b)
        return ('-' if sa<0 and resultado!='0' else '')+resultado
    if (len(a),a)<(len(b),b):a,b,sa=b,a,sb
    resultado=_restar_magnitudes(a,b)
    return ('-' if sa<0 and resultado!='0' else '')+resultado

def Reemplazar(pila,nuevo,viejo):
    """Reemplaza todas las apariciones de viejo por nuevo y conserva el orden."""
    auxiliar=Pila();cantidad=0
    while not pila.vacia():
        dato=pila.desapilar()
        if dato==viejo:dato=nuevo;cantidad+=1
        auxiliar.apilar(dato)
    while not auxiliar.vacia():pila.apilar(auxiliar.desapilar())
    return cantidad
