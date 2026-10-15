from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import json
import random
import time
from comun.estructuras import Cola,ColaCircularDoble

MOVIMIENTOS=('Pago de servicio','Depósito','Retiro','Compra de tiempo aire','Consulta de saldo')

@dataclass
class Cliente:
    turno:int
    nombre:str
    movimiento:str
    llegada:datetime
    instante:float

class Banco:
    def __init__(self,capacidad=5,reloj=time.monotonic,ahora=lambda:datetime.now().astimezone()):
        self.cola=Cola(capacidad);self.turno=0;self.reloj=reloj;self.ahora=ahora
    def llegar(self,nombre,movimiento):
        if self.cola.ColaLlena():raise OverflowError('La cola está llena. No se agregó el cliente.')
        if movimiento not in MOVIMIENTOS:raise ValueError('Movimiento inválido.')
        self.turno+=1
        cliente=Cliente(self.turno,nombre,movimiento,self.ahora(),self.reloj())
        self.cola.InsertaCola(cliente);return cliente
    def atender(self):
        cliente=self.cola.EliminaCola()
        return cliente,self.ahora(),max(0,self.reloj()-cliente.instante)

@dataclass
class Auto:
    placas:str
    propietario:str
    entrada:datetime
    instante:float

class Estacionamiento:
    TARIFA=Decimal('2.00')
    def __init__(self,reloj=time.monotonic,ahora=lambda:datetime.now().astimezone()):
        self.cola=ColaCircularDoble();self.reloj=reloj;self.ahora=ahora
    def entrar(self,placas,propietario):
        placas=placas.strip().upper()
        if any(a.placas==placas for a in self.cola):raise ValueError('Las placas ya están dentro del estacionamiento.')
        auto=Auto(placas,propietario,self.ahora(),self.reloj());self.cola.InsertaCola(auto);return auto
    def salir(self):
        auto=self.cola.EliminaCola();salida=self.ahora()
        segundos=Decimal(str(max(0,self.reloj()-auto.instante)))
        costo=(segundos*self.TARIFA).quantize(Decimal('0.01'),rounding=ROUND_HALF_UP)
        return auto,salida,segundos,costo

COLORES={'Rojo':'#E44759','Naranja':'#F09B45','Amarillo':'#F2D255',
         'Verde':'#45B88C','Azul':'#4C91DE','Morado':'#9870CB'}

@dataclass
class Coche:
    numero:int
    color:str

class JuegoCoches:
    """Modelo sin interfaz para probar llegadas y reglas con un reloj controlado."""
    def __init__(self,reloj=time.monotonic,aleatorio=None):
        self.reloj=reloj;self.aleatorio=aleatorio or random.Random();self.iniciar()
    @property
    def intervalo(self):return max(2,20-2*(self.pintados//3))
    @property
    def tiempo_total(self):
        return max(0,(self.fin if self.fin is not None else self.reloj())-self.inicio)
    def iniciar(self):
        self.cola=Cola(5);self.pintados=0;self.secuencia=0;self.terminado=False
        self.inicio=self.reloj();self.fin=None;self.proxima=self.inicio+20
        self._llegar()  # Un primer coche permite comenzar inmediatamente.
    def _llegar(self):
        self.secuencia+=1
        self.cola.InsertaCola(Coche(self.secuencia,self.aleatorio.choice(tuple(COLORES))))
    def actualizar(self):
        ahora=self.reloj()
        while not self.terminado and ahora>=self.proxima:
            instante=self.proxima;self._llegar()
            if len(self.cola)>=5:self.terminado=True;self.fin=instante
            else:self.proxima+=self.intervalo
    def pintar(self,color):
        self.actualizar()
        if self.terminado:return False,'La partida terminó: se acumularon cinco coches.'
        if self.cola.ColaVacia():return False,'Espera la llegada del siguiente coche.'
        coche=self.cola.primero()
        if color!=coche.color:return False,f'Color incorrecto. El primer coche solicita {coche.color}.'
        self.cola.EliminaCola();self.pintados+=1
        self.proxima=min(self.proxima,self.reloj()+self.intervalo)
        return True,f'Coche {coche.numero} pintado de {color}. ¡Bien hecho!'

class Record:
    def __init__(self,ruta):
        self.ruta=Path(ruta);self.pintados=0;self.tiempo=0.0;self.aviso=''
        try:
            datos=json.loads(self.ruta.read_text(encoding='utf-8'))
            puntos=datos['pintados'];tiempo=datos['tiempo']
            if not isinstance(puntos,int) or puntos<0 or not isinstance(tiempo,(int,float)) or not 0<=tiempo<1e12:
                raise ValueError('Récord inválido.')
            self.pintados,self.tiempo=puntos,float(tiempo)
        except FileNotFoundError:pass
        except (OSError,ValueError,TypeError,KeyError):self.aviso='No se pudo leer el récord anterior; se inicia en cero.'
    def guardar(self,pintados,tiempo):
        # En empate, conservar el tiempo menor para la misma cantidad pintada.
        if pintados<self.pintados or (pintados==self.pintados and self.tiempo>0 and tiempo>=self.tiempo):return False
        self.pintados,self.tiempo=pintados,tiempo
        try:
            self.ruta.parent.mkdir(parents=True,exist_ok=True)
            temporal=self.ruta.with_suffix('.tmp')
            temporal.write_text(json.dumps({'pintados':pintados,'tiempo':tiempo},indent=2),encoding='utf-8')
            temporal.replace(self.ruta)
        except OSError:self.aviso='El récord se conserva en esta sesión; no se pudo guardar en disco.'
        return True
