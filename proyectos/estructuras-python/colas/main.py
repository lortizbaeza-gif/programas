if __package__ in (None,''):
    import sys
    from pathlib import Path
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from comun.interfaz import menu,texto,entero,tabla,ejecutar
from colas.modelos import Banco,Estacionamiento,MOVIMIENTOS

def hora(fecha):return fecha.strftime('%Y-%m-%d %H:%M:%S %Z')

class AplicacionColas:
    def __init__(self):self.banco=Banco();self.estacionamiento=Estacionamiento()
    def mostrar_banco(self):
        cola=self.banco.cola
        tabla(['Turno','Nombre','Movimiento','Llegada'],((c.turno,c.nombre,c.movimiento,hora(c.llegada)) for c in cola))
        print(f'En espera: {len(cola)} / {cola.capacidad}')
        print('Frente:',cola.frente.dato.turno if cola.frente else '(vacío)', '| Final:',cola.final.dato.turno if cola.final else '(vacío)')
    def ventanilla(self):
        while True:
            op=menu('C1. Ventanilla de un banco',['Agregar cliente','Atender en ventanilla','Mostrar cola','Cambiar capacidad (sólo con cola vacía)'])
            if op==0:return
            if op==1:
                if self.banco.cola.ColaLlena():print('La cola está llena. Atiende un cliente.');self.mostrar_banco();continue
                nombre=texto('Nombre del cliente: ')
                tipo=menu('Selecciona el movimiento',MOVIMIENTOS)
                if tipo==0:print('Registro cancelado.');continue
                cliente=self.banco.llegar(nombre,MOVIMIENTOS[tipo-1]);print('Cliente agregado. Turno:',cliente.turno)
            if op==2:
                if self.banco.cola.ColaVacia():print('La cola está vacía. No hay clientes por atender.');self.mostrar_banco();continue
                cliente,atencion,espera=self.banco.atender()
                print(f'ATENDIDO: turno {cliente.turno}, {cliente.nombre}, {cliente.movimiento}')
                print('Llegada:',hora(cliente.llegada),'| Atención:',hora(atencion));print(f'Tiempo de espera: {espera:.2f} segundos')
            if op==4:
                if not self.banco.cola.ColaVacia():print('Primero atiende a todos los clientes.')
                else:self.banco.cola.capacidad=entero('Capacidad de espera (1-1000): ',1,1000)
            self.mostrar_banco()
    def parking(self):
        while True:
            op=menu('C3. Estacionamiento FIFO - $2.00 por segundo',['Entrada de auto','Salida del primer auto','Mostrar estacionamiento'])
            if op==0:return
            if op==1:
                placas=texto('Placas: ',20);propietario=texto('Propietario: ')
                try:auto=self.estacionamiento.entrar(placas,propietario);print('Entrada confirmada:',auto.placas,hora(auto.entrada))
                except ValueError as error:print(error)
            if op==2:
                if self.estacionamiento.cola.ColaVacia():print('El estacionamiento está vacío.');continue
                auto,salida,segundos,costo=self.estacionamiento.salir()
                print('\nRECIBO DE ESTACIONAMIENTO\nPlacas:',auto.placas,'| Propietario:',auto.propietario)
                print('Entrada:',hora(auto.entrada),'\nSalida:',hora(salida))
                print(f'Duración: {segundos:.3f} segundos | Tarifa: $2.00/segundo\nTOTAL A PAGAR: ${costo:.2f}')
            cola=self.estacionamiento.cola
            tabla(['Placas','Propietario','Entrada'],((a.placas,a.propietario,hora(a.entrada)) for a in cola))
            print('Frente:',cola.frente.dato.placas if cola.frente else '(vacío)','| Final:',cola.final.dato.placas if cola.final else '(vacío)')
    def juego(self):
        try:
            from colas.juego import abrir_juego
            abrir_juego()
        except ImportError:print('El juego necesita Tkinter, incluido en la instalación habitual de Python para Windows.')
        except Exception as error:
            # Mantener el menú disponible ante un entorno sin pantalla.
            import tkinter
            if isinstance(error,tkinter.TclError):print('No se pudo abrir la ventana del juego:',error)
            else:raise
    def ejecutar(self):
        acciones=[self.ventanilla,self.juego,self.parking]
        while True:
            op=menu('PRÁCTICA DE COLAS',['Ventanilla de un banco','Juego pintar coches (ventana)','Estacionamiento circular doble'])
            if op==0:return
            acciones[op-1]()

if __name__=='__main__':ejecutar(AplicacionColas().ejecutar)
