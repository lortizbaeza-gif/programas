import unittest
from unittest.mock import patch
from contextlib import redirect_stdout
from io import StringIO
from listas.main import AplicacionListas
from pilas.main import AplicacionPilas
from colas.main import AplicacionColas

def simular(funcion,entradas):
    with patch('builtins.input',side_effect=entradas),redirect_stdout(StringIO()) as salida:
        funcion()
    return salida.getvalue()

class MenusTest(unittest.TestCase):
    def test_listas_registro_entre_opciones(self):
        app=AplicacionListas()
        salida=simular(app.ejecutar,['3','1','Ana','7.5','0','3','2','0','0'])
        self.assertGreaterEqual(salida.count('Ana'),2)
        self.assertIn('7.5',salida)
    def test_lista_productos_clave_inexistente(self):
        salida=simular(AplicacionListas().productos,['1','2','2','99','0'])
        self.assertIn('La clave no existe',salida)
    def test_pares_menu_validado(self):
        salida=simular(AplicacionListas().pares,['letras','1','0','4','-2','2','0'])
        self.assertIn('sólo números enteros',salida);self.assertIn('Pares:',salida);self.assertIn('Impares:',salida)
    def test_calificaciones_datos_incorrectos(self):
        salida=simular(AplicacionListas().calificaciones,['1','','Ana','once','11','6.5','0'])
        self.assertIn('Hay datos faltantes',salida);self.assertIn('REPROBADOS',salida);self.assertIn('6.5',salida)
    def test_compra_duplicado_y_total(self):
        salida=simular(AplicacionListas().compras,['1','A','Pan','2.50','1','a','2','NO','0'])
        self.assertIn('La clave ya existe',salida);self.assertIn('TOTAL DE COMPRA: $2.50',salida)
    def test_palabras(self):
        salida=simular(AplicacionListas().clasificar_palabras,['1','Fresa','1','Fresca','1','Oso','0'])
        self.assertIn('Lista F: Fresa, Fresca',salida);self.assertIn('Lista O: Oso',salida)
    def test_pilas_menu_varios_ejercicios(self):
        salida=simular(AplicacionPilas().ejecutar,['1','UTM','2','Ana','3','999','1','0'])
        self.assertIn('MTU',salida);self.assertIn('Sí es un palíndromo',salida);self.assertIn('= 1000',salida)
    def test_reemplazar_consola(self):
        salida=simular(AplicacionPilas().reemplazar,['2','1','5','1','2','1','5','3','5','9','0'])
        self.assertIn('La pila está vacía',salida);self.assertIn('Apariciones reemplazadas: 2',salida)
        self.assertIn('[9, 2, 9]',salida)
    def test_banco_lleno_vacio_y_capacidad(self):
        salida=simular(AplicacionColas().ventanilla,['2','4','1','1','Ana','2','1','2','0'])
        self.assertIn('La cola está vacía',salida);self.assertIn('La cola está llena',salida)
        self.assertIn('ATENDIDO: turno 1, Ana',salida);self.assertIn('Frente:',salida)
    def test_parking_duplicado_vacio_y_salida(self):
        salida=simular(AplicacionColas().parking,['2','1','ABC','Ana','1','abc','Otro','2','0'])
        self.assertIn('El estacionamiento está vacío',salida)
        self.assertIn('Las placas ya están dentro',salida);self.assertIn('TOTAL A PAGAR:',salida)

if __name__=='__main__':unittest.main()
