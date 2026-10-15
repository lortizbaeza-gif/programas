if __package__ in (None,''):
    import sys
    from pathlib import Path
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from comun.interfaz import menu,texto,entero,ejecutar
from comun.estructuras import Pila
from pilas.modelos import invertir,es_palindromo,normalizar_palindromo,sumar_grandes,Reemplazar

class AplicacionPilas:
    def __init__(self):self.pila=Pila()
    def palabra(self):
        palabra=texto('Palabra a invertir: ',2000)
        print('Original:',palabra);print('Invertida:',invertir(palabra))
    def palindromo(self):
        while True:
            palabra=texto('Palabra, número o frase: ',2000)
            try:resultado=es_palindromo(palabra);break
            except ValueError as error:print(error)
        print('Texto normalizado:',normalizar_palindromo(palabra))
        print('Sí es un palíndromo.' if resultado else 'No es un palíndromo.')
    def numeros_grandes(self):
        while True:
            a=texto('Primer entero (admite signo): ',10000)
            b=texto('Segundo entero (admite signo): ',10000)
            try:resultado=sumar_grandes(a,b);break
            except ValueError as error:print(error)
        print('  '+a+'\n+ '+b+'\n= '+resultado)
    def reemplazar(self):
        while True:
            op=menu('P4. Reemplazar valor',['Apilar entero','Desapilar','Reemplazar viejo por nuevo','Mostrar pila'])
            if op==0:return
            if op==1:self.pila.apilar(entero('Entero a apilar: '))
            if op==2:
                if self.pila.vacia():print('La pila está vacía.')
                else:print('Valor retirado:',self.pila.desapilar())
            if op==3:
                if self.pila.vacia():print('La pila está vacía.');continue
                viejo=entero('Valor viejo que deseas reemplazar: ');nuevo=entero('Valor nuevo: ')
                cantidad=Reemplazar(self.pila,nuevo,viejo);print('Apariciones reemplazadas:',cantidad)
            print('Pila (cima a base):',list(self.pila))
    def ejecutar(self):
        acciones=[self.palabra,self.palindromo,self.numeros_grandes,self.reemplazar]
        while True:
            op=menu('PRÁCTICA DE PILAS',['Invertir palabra','Palíndromo','Suma de números grandes','Reemplazar valor'])
            if op==0:return
            acciones[op-1]()

if __name__=='__main__':ejecutar(AplicacionPilas().ejecutar)
