"""Pruebas de lógica y consola. Sólo biblioteca estándar."""
import random
import sys
import tempfile
import unittest
from datetime import datetime,timezone
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch
from contextlib import redirect_stdout
from io import StringIO

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from comun.estructuras import ListaDoble,Pila,Cola,ColaCircularDoble
from comun.interfaz import entero,decimal,texto
from listas.modelos import Inventario,separar_numeros,RegistroAlumnos,Compra,Palabras
from pilas.modelos import invertir,es_palindromo,sumar_grandes,Reemplazar
from colas.modelos import Banco,Estacionamiento,JuegoCoches,Record,MOVIMIENTOS

class Reloj:
    def __init__(self):self.t=0.0
    def __call__(self):return self.t
    def avanzar(self,segundos):self.t+=segundos

class EstructurasTest(unittest.TestCase):
    def test_lista_extremos_y_orden(self):
        l=ListaDoble()
        for n in (3,1,2,2):l.agregar(n)
        l.ordenar(lambda n:n);self.assertEqual(list(l),[1,2,2,3])
        self.assertIsNone(l.cabeza.anterior);self.assertIsNone(l.cola.siguiente)
        l.extraer(lambda n:n==1);l.extraer(lambda n:n==3)
        self.assertEqual(list(l),[2,2]);self.assertIs(l.cabeza.siguiente.anterior,l.cabeza)
        l.extraer(lambda n:True);l.extraer(lambda n:True)
        self.assertEqual(len(l),0);self.assertIsNone(l.cabeza);self.assertIsNone(l.cola)
    def test_pila_lifo_y_vacia(self):
        p=Pila()
        with self.assertRaises(IndexError):p.desapilar()
        p.apilar(1);p.apilar(2);self.assertEqual(p.desapilar(),2);self.assertEqual(p.desapilar(),1)
        self.assertTrue(p.vacia())
    def test_cola_fifo_llena_vacia(self):
        q=Cola(2);q.InsertaCola(1);q.InsertaCola(2)
        self.assertTrue(q.ColaLlena())
        with self.assertRaises(OverflowError):q.InsertaCola(3)
        self.assertEqual(q.EliminaCola(),1);self.assertEqual(q.EliminaCola(),2)
        self.assertIsNone(q.final)
        with self.assertRaises(IndexError):q.EliminaCola()
    def test_cola_circular_invariantes(self):
        q=ColaCircularDoble()
        for n in range(50):q.InsertaCola(n)
        self.assertIs(q.final.siguiente,q.frente);self.assertIs(q.frente.anterior,q.final)
        nodo=q.frente
        for _ in range(50):
            self.assertIs(nodo.siguiente.anterior,nodo);nodo=nodo.siguiente
        self.assertIs(nodo,q.frente)
        for n in range(49):self.assertEqual(q.EliminaCola(),n)
        self.assertIs(q.frente.siguiente,q.frente);self.assertIs(q.frente.anterior,q.frente)
        self.assertEqual(q.EliminaCola(),49);self.assertTrue(q.ColaVacia());self.assertIsNone(q.final)

class ListasTest(unittest.TestCase):
    def test_inventario_retiro(self):
        inv=Inventario(random.Random(10));inv.generar(3)
        p=inv.retirar('2');self.assertEqual(p.nombre,'producto2')
        self.assertEqual(len(inv.disponibles),2);self.assertEqual(len(inv.retirados),1)
        self.assertIsNone(inv.retirar('2'))
        self.assertTrue(all(1<=p.cantidad<=50 and Decimal('1')<=p.precio<=500 for p in inv.disponibles))
    def test_pares_cero_negativos(self):
        origen=ListaDoble()
        for n in (-3,-2,0,1,4):origen.agregar(n)
        p,i=separar_numeros(origen);self.assertEqual(list(p),[-2,0,4]);self.assertEqual(list(i),[-3,1])
    def test_calificaciones_limite(self):
        r=RegistroAlumnos();r.agregar('Ana',Decimal('7'));r.agregar('Luis',Decimal('6.99'))
        self.assertEqual([a.nombre for a in r.aprobados],['Ana']);self.assertEqual([a.nombre for a in r.reprobados],['Luis'])
        with self.assertRaises(ValueError):r.agregar('Otro',Decimal('11'))
    def test_compra_orden_total_claves(self):
        c=Compra();c.agregar('B','Zanahoria',Decimal('0.20'));c.agregar('A','Arroz',Decimal('0.10'))
        c.ordenar();self.assertEqual([p.nombre for p in c.productos],['Arroz','Zanahoria'])
        self.assertEqual(c.total(),Decimal('0.30'))
        with self.assertRaises(ValueError):c.agregar('a','Otro',Decimal('2'))
        self.assertIsNotNone(c.eliminar('b'));self.assertEqual(c.total(),Decimal('0.10'))
    def test_palabras_grupos_nuevos(self):
        p=Palabras()
        for palabra in ('Fresa','fresca','Orilla','Oso','Árbol','agua'):p.agregar(palabra)
        self.assertEqual(list(p.grupos['F']),['Fresa','fresca']);self.assertEqual(list(p.grupos['A']),['Árbol','agua'])
        with self.assertRaises(ValueError):p.agregar('dos palabras')

class PilasTest(unittest.TestCase):
    def test_invertir(self):self.assertEqual(invertir('UTM'),'MTU');self.assertEqual(invertir('árbol'),'lobrá')
    def test_palindromos(self):
        for palabra in ('Ana','Anita lava la tina','12321','Ána'):self.assertTrue(es_palindromo(palabra))
        self.assertFalse(es_palindromo('Python'))
        with self.assertRaises(ValueError):es_palindromo('...')
    def test_suma_casos_y_signos(self):
        for a,b in [('999','1'),('-999','1'),('1','-999'),('-12','-3'),('-15','15'),('000','-0'),('123','-23')]:
            self.assertEqual(sumar_grandes(a,b),str(int(a)+int(b)))
        with self.assertRaises(ValueError):sumar_grandes('12.3','1')
    def test_suma_diez_mil_digitos(self):
        self.assertEqual(sumar_grandes('9'*10000,'1'),'1'+'0'*10000)
    def test_sumas_aleatorias(self):
        rng=random.Random(123)
        for _ in range(200):
            a=rng.randint(-10**90,10**90);b=rng.randint(-10**90,10**90)
            self.assertEqual(sumar_grandes(str(a),str(b)),str(a+b))
    def test_reemplazo_orden(self):
        p=Pila()
        for x in (5,2,5,8):p.apilar(x)
        self.assertEqual(Reemplazar(p,9,5),2);self.assertEqual(list(p),[8,9,2,9])
        self.assertEqual(Reemplazar(p,0,77),0);self.assertEqual(list(p),[8,9,2,9])

class ColasTest(unittest.TestCase):
    def test_banco_fifo_espera(self):
        reloj=Reloj();b=Banco(2,reloj)
        b.llegar('Ana',MOVIMIENTOS[0]);reloj.avanzar(4);b.llegar('Luis',MOVIMIENTOS[1])
        with self.assertRaises(OverflowError):b.llegar('Tercero',MOVIMIENTOS[2])
        reloj.avanzar(6);cliente,_,espera=b.atender();self.assertEqual(cliente.nombre,'Ana');self.assertEqual(espera,10)
        self.assertEqual(b.cola.primero().nombre,'Luis')
    def test_parking_cobro_y_fifo(self):
        reloj=Reloj();e=Estacionamiento(reloj)
        e.entrar('abc-1','Ana');reloj.avanzar(1);e.entrar('xyz-2','Luis')
        with self.assertRaises(ValueError):e.entrar('ABC-1','Duplicado')
        reloj.avanzar(11.5);auto,_,segundos,costo=e.salir()
        self.assertEqual(auto.placas,'ABC-1');self.assertEqual(segundos,Decimal('12.5'));self.assertEqual(costo,Decimal('25.00'))
        self.assertEqual(e.cola.primero().placas,'XYZ-2')
    def test_juego_primera_llegada_y_error(self):
        reloj=Reloj();j=JuegoCoches(reloj,random.Random(1));self.assertEqual(len(j.cola),1)
        esperado=j.cola.primero().color
        incorrecto=next(c for c in ('Rojo','Azul','Verde') if c!=esperado)
        self.assertFalse(j.pintar(incorrecto)[0]);self.assertEqual(len(j.cola),1)
        self.assertTrue(j.pintar(esperado)[0]);self.assertEqual(j.pintados,1);self.assertEqual(len(j.cola),0)
        self.assertFalse(j.pintar(esperado)[0]);reloj.avanzar(20);j.actualizar();self.assertEqual(len(j.cola),1)
    def test_juego_aceleracion(self):
        reloj=Reloj();j=JuegoCoches(reloj,random.Random(1))
        for _ in range(3):
            if j.cola.ColaVacia():reloj.t=j.proxima;j.actualizar()
            j.pintar(j.cola.primero().color)
        self.assertEqual(j.pintados,3);self.assertEqual(j.intervalo,18)
        for _ in range(30):
            if j.cola.ColaVacia():reloj.t=j.proxima;j.actualizar()
            j.pintar(j.cola.primero().color)
        self.assertEqual(j.intervalo,2)
    def test_juego_fin_exacto(self):
        reloj=Reloj();j=JuegoCoches(reloj);reloj.avanzar(100);j.actualizar()
        self.assertTrue(j.terminado);self.assertEqual(len(j.cola),5);self.assertEqual(j.tiempo_total,80)
        self.assertFalse(j.pintar(j.cola.primero().color)[0]);self.assertEqual(j.pintados,0)
    def test_record_persistencia(self):
        with tempfile.TemporaryDirectory() as carpeta:
            ruta=Path(carpeta)/'record.json';r=Record(ruta);r.guardar(3,65)
            r=Record(ruta);self.assertEqual(r.pintados,3);self.assertEqual(r.tiempo,65)
            self.assertFalse(r.guardar(2,20));self.assertTrue(r.guardar(3,60))
            ruta.write_text('dañado',encoding='utf-8');self.assertEqual(Record(ruta).pintados,0)

class ValidacionTest(unittest.TestCase):
    def test_entero_reintenta(self):
        with patch('builtins.input',side_effect=['abc','1.2','-1','3']),redirect_stdout(StringIO()) as salida:
            self.assertEqual(entero('Dato:',0,5),3)
        self.assertIn('sólo números enteros',salida.getvalue())
    def test_decimal_reintenta(self):
        with patch('builtins.input',side_effect=['NaN','-1','1.234','2,50']),redirect_stdout(StringIO()):
            self.assertEqual(decimal('Precio:',dinero=True),Decimal('2.50'))
    def test_texto_vacio(self):
        with patch('builtins.input',side_effect=['','  ','Ana']),redirect_stdout(StringIO()):
            self.assertEqual(texto('Nombre:'),'Ana')

if __name__=='__main__':unittest.main()
