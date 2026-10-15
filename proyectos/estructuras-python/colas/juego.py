"""Juego visual con Tkinter. La lógica FIFO vive en modelos.JuegoCoches."""
if __package__ in (None,''):
    import sys
    from pathlib import Path
    sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from pathlib import Path
import tkinter as tk
from colas.modelos import JuegoCoches,Record,COLORES

FONDO='#F7F5FC'
TINTA='#252642'
LILA='#7956B5'

def configurar_dpi():
    """Evita coordenadas virtualizadas y recortes por escalado en Windows."""
    import sys
    if sys.platform=='win32':
        import ctypes
        try:ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except (AttributeError,OSError):pass

class VentanaJuego:
    def __init__(self,raiz,modelo=None,ruta_record=None):
        self.raiz=raiz;self.modelo=modelo or JuegoCoches()
        raiz.tk.call('tk','scaling',1.3333333333)
        self.record=Record(ruta_record or Path(__file__).resolve().parents[1]/'datos'/'record_coches.json')
        self.activo=False;self.cerrado=False;self.callback=None
        raiz.title('Taller de colores | Práctica de colas')
        raiz.geometry('1100x740');raiz.resizable(False,False);raiz.configure(bg=FONDO)
        tk.Label(raiz,text='Taller de colores',font=('Segoe UI',30,'bold'),bg=FONDO,fg=TINTA).pack(pady=(22,2))
        tk.Label(raiz,text='Pinta el primer coche con el color solicitado. Cinco coches en espera terminan la partida.',
                 font=('Segoe UI',12),bg=FONDO,fg='#67627D').pack()
        self.estadisticas=tk.Label(raiz,font=('Segoe UI',15,'bold'),bg=FONDO,fg=LILA)
        self.estadisticas.pack(pady=15)
        self.lienzo=tk.Canvas(raiz,width=1060,height=255,bg='#EAE5F3',highlightthickness=0)
        self.lienzo.pack(padx=20)
        self.mensaje=tk.Label(raiz,text='Pulsa Iniciar partida. La primera llegada está lista para atender.',
                              font=('Segoe UI',12,'bold'),bg=FONDO,fg=TINTA,wraplength=1020)
        self.mensaje.pack(pady=(17,8))
        tk.Label(raiz,text='PALETA DE COLORES',font=('Segoe UI',10,'bold'),bg=FONDO,fg='#67627D').pack()
        paleta=tk.Frame(raiz,bg=FONDO);paleta.pack(pady=9)
        self.botones=[]
        for nombre,color in COLORES.items():
            boton=tk.Button(paleta,text=nombre,bg=color,fg=TINTA if nombre=='Amarillo' else 'white',
                            font=('Segoe UI',13,'bold'),width=10,pady=12,relief='flat',
                            command=lambda elegido=nombre:self.pintar(elegido),state='disabled')
            boton.pack(side='left',padx=5);self.botones.append(boton)
        acciones=tk.Frame(raiz,bg=FONDO);acciones.pack(pady=8)
        tk.Button(acciones,text='Iniciar / reiniciar partida',font=('Segoe UI',12,'bold'),bg=LILA,fg='white',
                  relief='flat',padx=20,pady=9,command=self.iniciar).pack(side='left',padx=6)
        tk.Button(acciones,text='Cerrar y volver al menú',font=('Segoe UI',12),bg='#DBEDE6',fg=TINTA,
                  relief='flat',padx=20,pady=9,command=self.cerrar).pack(side='left',padx=6)
        self.etiqueta_record=tk.Label(raiz,font=('Segoe UI',11),bg=FONDO,fg='#67627D');self.etiqueta_record.pack(pady=6)
        tk.Label(raiz,text='Llegadas cada 20 s. Cada 3 aciertos, el intervalo baja 2 s hasta un mínimo de 2 s.',
                 font=('Segoe UI',10),bg=FONDO,fg='#67627D').pack()
        raiz.protocol('WM_DELETE_WINDOW',self.cerrar)
        self.dibujar();self.actualizar_record();self.callback=raiz.after(100,self.pulso)

    def iniciar(self):
        self.modelo.iniciar();self.activo=True
        for boton in self.botones:boton.configure(state='normal')
        self.mensaje.configure(text='Selecciona el color del primer coche. Los coches llegan automáticamente.',fg=TINTA)
        self.dibujar()

    def coche(self,x,y,numero,color,primero):
        c=self.lienzo
        c.create_text(x+85,y-15,text='ATENDER PRIMERO' if primero else f'En espera #{numero}',
                      fill=LILA if primero else '#67627D',font=('Segoe UI',10,'bold'))
        c.create_polygon(x+25,y+80,x+45,y+40,x+111,y+40,x+141,y+80,
                         fill='#FFFFFF',outline=TINTA,width=2)
        c.create_rectangle(x+11,y+78,x+159,y+120,fill='#FFFFFF',outline=TINTA,width=2)
        c.create_polygon(x+51,y+48,x+78,y+48,x+78,y+75,x+39,y+75,fill='#BDD9E8',outline=TINTA)
        c.create_polygon(x+85,y+48,x+106,y+48,x+128,y+75,x+85,y+75,fill='#BDD9E8',outline=TINTA)
        for rueda in (x+44,x+129):
            c.create_oval(rueda-15,y+105,rueda+15,y+135,fill=TINTA,outline=TINTA)
            c.create_oval(rueda-6,y+114,rueda+6,y+126,fill='#A6A4B5',outline='')
        c.create_rectangle(x+11,y+155,x+159,y+193,fill=COLORES[color],outline='')
        c.create_text(x+85,y+174,text=color,fill=TINTA if color=='Amarillo' else '#FFFFFF',font=('Segoe UI',13,'bold'))
        c.create_text(x+85,y+101,text=f'#{numero}',font=('Segoe UI',10,'bold'),fill=TINTA)

    def dibujar(self):
        self.lienzo.delete('all')
        for i,coche in enumerate(self.modelo.cola):self.coche(22+i*210,35,coche.numero,coche.color,i==0)
        if self.modelo.cola.ColaVacia():
            self.lienzo.create_text(530,120,text='¡Cola vacía! Espera al siguiente coche.',font=('Segoe UI',20,'bold'),fill=LILA)
        restantes=max(0,self.modelo.proxima-self.modelo.reloj()) if self.activo and not self.modelo.terminado else 0
        tiempo=self.modelo.tiempo_total if self.activo else 0
        self.estadisticas.configure(text=f'Pintados: {self.modelo.pintados}     Cola: {len(self.modelo.cola)}/5     Tiempo: {tiempo:.1f} s     Próximo: {restantes:.1f} s')

    def pintar(self,color):
        if not self.activo or self.modelo.terminado:return
        correcto,mensaje=self.modelo.pintar(color)
        self.mensaje.configure(text=mensaje,fg='#258467' if correcto else '#C53E50')
        self.comprobar_fin();self.dibujar()

    def comprobar_fin(self):
        if self.modelo.terminado:
            for boton in self.botones:boton.configure(state='disabled')
            self.record.guardar(self.modelo.pintados,self.modelo.tiempo_total)
            self.actualizar_record()
            self.mensaje.configure(text=f'FIN DE PARTIDA: 5 coches en espera. Pintaste {self.modelo.pintados} en {self.modelo.tiempo_total:.1f} segundos.',fg='#C53E50')

    def actualizar_record(self):
        mensaje=f'Récord de partidas terminadas: {self.record.pintados} coches pintados | Tiempo: {self.record.tiempo:.1f} s'
        self.etiqueta_record.configure(text=mensaje+(' | '+self.record.aviso if self.record.aviso else ''))

    def pulso(self):
        if self.cerrado:return
        if self.activo and not self.modelo.terminado:
            self.modelo.actualizar();self.comprobar_fin();self.dibujar()
        self.callback=self.raiz.after(100,self.pulso)

    def cerrar(self):
        self.cerrado=True
        if self.callback is not None:self.raiz.after_cancel(self.callback)
        self.raiz.destroy()

def abrir_juego():
    configurar_dpi()
    raiz=tk.Tk();VentanaJuego(raiz);raiz.mainloop()

if __name__=='__main__':abrir_juego()
