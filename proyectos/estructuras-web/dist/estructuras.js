/* Estructuras enlazadas reales. No dependen del navegador ni de librerías. */
globalThis.ED = (() => {
  class Nodo { constructor(dato) { this.dato=dato;this.anterior=null;this.siguiente=null; } }
  class ListaDoble {
    constructor(){this.cabeza=null;this.cola=null;this.cantidad=0;}
    agregar(dato){const n=new Nodo(dato);n.anterior=this.cola;if(this.cola)this.cola.siguiente=n;else this.cabeza=n;this.cola=n;this.cantidad++;return dato;}
    *[Symbol.iterator](){let n=this.cabeza;while(n){yield n.dato;n=n.siguiente;}}
    buscar(predicado){for(const dato of this)if(predicado(dato))return dato;return null;}
    extraer(predicado){let n=this.cabeza;while(n){if(predicado(n.dato)){if(n.anterior)n.anterior.siguiente=n.siguiente;else this.cabeza=n.siguiente;if(n.siguiente)n.siguiente.anterior=n.anterior;else this.cola=n.anterior;this.cantidad--;n.anterior=n.siguiente=null;return n.dato;}n=n.siguiente;}return null;}
    ordenar(clave){const orden=new ListaDoble();let n=this.cabeza;while(n){const siguiente=n.siguiente;n.anterior=n.siguiente=null;let p=orden.cabeza;while(p&&clave(p.dato).localeCompare(clave(n.dato),'es',{sensitivity:'base'})<=0)p=p.siguiente;if(!p){n.anterior=orden.cola;if(orden.cola)orden.cola.siguiente=n;else orden.cabeza=n;orden.cola=n;}else{n.anterior=p.anterior;n.siguiente=p;if(p.anterior)p.anterior.siguiente=n;else orden.cabeza=n;p.anterior=n;}orden.cantidad++;n=siguiente;}this.cabeza=orden.cabeza;this.cola=orden.cola;this.cantidad=orden.cantidad;}
  }
  class Pila {
    constructor(){this.cima=null;this.cantidad=0;}
    apilar(dato){const n=new Nodo(dato);n.siguiente=this.cima;this.cima=n;this.cantidad++;}
    desapilar(){if(!this.cima)throw Error('La pila está vacía.');const d=this.cima.dato;this.cima=this.cima.siguiente;this.cantidad--;return d;}
    *[Symbol.iterator](){let n=this.cima;while(n){yield n.dato;n=n.siguiente;}}
  }
  class Cola {
    constructor(capacidad=Infinity){if(capacidad<1)throw Error('Capacidad inválida.');this.capacidad=capacidad;this.frente=null;this.final=null;this.cantidad=0;}
    ColaVacia(){return this.cantidad===0;}
    ColaLlena(){return this.cantidad>=this.capacidad;}
    InsertaCola(dato){if(this.ColaLlena())throw Error('La cola está llena. Atiende primero.');const n=new Nodo(dato);if(this.final)this.final.siguiente=n;else this.frente=n;this.final=n;this.cantidad++;return dato;}
    EliminaCola(){if(this.ColaVacia())throw Error('La cola está vacía.');const dato=this.frente.dato;this.frente=this.frente.siguiente;if(!this.frente)this.final=null;this.cantidad--;return dato;}
    primero(){if(this.ColaVacia())throw Error('La cola está vacía.');return this.frente.dato;}
    *[Symbol.iterator](){let n=this.frente;while(n){yield n.dato;n=n.siguiente;}}
  }
  class ColaCircularDoble {
    constructor(){this.frente=null;this.final=null;this.cantidad=0;}
    ColaVacia(){return this.cantidad===0;}
    ColaLlena(){return false;}
    InsertaCola(dato){const n=new Nodo(dato);if(this.ColaVacia()){n.anterior=n.siguiente=n;this.frente=this.final=n;}else{n.anterior=this.final;n.siguiente=this.frente;this.final.siguiente=n;this.frente.anterior=n;this.final=n;}this.cantidad++;return dato;}
    EliminaCola(){if(this.ColaVacia())throw Error('El estacionamiento está vacío.');const n=this.frente;if(this.cantidad===1)this.frente=this.final=null;else{this.frente=n.siguiente;this.frente.anterior=this.final;this.final.siguiente=this.frente;}n.anterior=n.siguiente=null;this.cantidad--;return n.dato;}
    *[Symbol.iterator](){let n=this.frente;for(let i=0;i<this.cantidad;i++){yield n.dato;n=n.siguiente;}}
  }
  const texto=(v,max=80)=>{v=String(v??'').normalize('NFC').trim();if(!v)throw Error('Hay datos faltantes. Completa todos los campos.');if(v.length>max)throw Error(`Máximo ${max} caracteres.`);if(/[\p{Cc}\p{Cf}]/u.test(v))throw Error('No se permiten caracteres de control.');return v;};
  const entero=(v,min=-1000000,max=1000000)=>{if(!/^[+-]?\d+$/.test(String(v).trim()))throw Error('Introduce sólo números enteros.');const n=Number(v);if(!Number.isSafeInteger(n)||n<min||n>max)throw Error(`El valor debe ser un entero entre ${min} y ${max}.`);return n;};
  const decimal=(v,min=0,max=10)=>{v=String(v).trim().replace(',','.');if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(v))throw Error('Introduce un número válido. Puedes usar punto o coma decimal.');const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(`El valor debe estar entre ${min} y ${max}.`);return n;};
  const centavos=v=>{v=String(v).trim().replace(',','.');if(!/^\d+(?:\.\d{1,2})?$/.test(v))throw Error('El precio debe ser positivo o cero, con hasta dos decimales.');const [e,d='']=v.split('.');const n=Number(e)*100+Number(d.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>100000000000)throw Error('El precio máximo es $1,000,000,000.00.');return n;};
  const normalizar=v=>v.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('es');
  const invertir=v=>{const p=new Pila();for(const c of v.normalize('NFC'))p.apilar(c);let r='';while(p.cantidad)r+=p.desapilar();return r;};
  const palindromo=v=>{const limpio=normalizar(v).replace(/[^\p{L}\p{N}]/gu,'');if(!limpio)throw Error('Incluye al menos una letra o un número.');return {limpio,resultado:limpio===invertir(limpio)};};
  function sumarGrandes(a,b){
    function validar(v){v=String(v).trim();if(!/^[+-]?\d+$/.test(v)||v.replace(/^[+-]/,'').length>10000)throw Error('Escribe un entero de hasta 10 000 dígitos, con signo opcional.');const m=v.replace(/^[+-]/,'').replace(/^0+/,'')||'0';return {m,s:v[0]==='-'&&m!=='0'?-1:1};}
    let x=validar(a),y=validar(b);const p=new Pila(),q=new Pila(),r=new Pila();
    if(x.s!==y.s&&(x.m.length<y.m.length||(x.m.length===y.m.length&&x.m<y.m)))[x,y]=[y,x];
    for(const d of x.m)p.apilar(Number(d));for(const d of y.m)q.apilar(Number(d));
    let carry=0;
    while(p.cantidad||q.cantidad||carry){let valor=(p.cantidad?p.desapilar():0)+(x.s===y.s?1:-1)*(q.cantidad?q.desapilar():0)+(x.s===y.s?carry:-carry);if(x.s===y.s){carry=Math.floor(valor/10);r.apilar(valor%10);}else{carry=valor<0?1:0;r.apilar(valor<0?valor+10:valor);}}
    let valor='';while(r.cantidad)valor+=r.desapilar();valor=valor.replace(/^0+/,'')||'0';return (x.s<0&&valor!=='0'?'-':'')+valor;
  }
  function reemplazar(pila,nuevo,viejo){const aux=new Pila();let n=0;while(pila.cantidad){let d=pila.desapilar();if(d===viejo){d=nuevo;n++;}aux.apilar(d);}while(aux.cantidad)pila.apilar(aux.desapilar());return n;}
  const COLORES={Rojo:'#e35e73',Naranja:'#ed9b54',Amarillo:'#ebc94d',Verde:'#56ae92',Azul:'#629fda',Morado:'#9b7bc7'};
  class JuegoCoches {
    constructor(reloj=()=>performance.now()/1000,aleatorio=Math.random){this.reloj=reloj;this.aleatorio=aleatorio;this.iniciar();}
    get intervalo(){return Math.max(2,20-2*Math.floor(this.pintados/3));}
    get tiempo(){return Math.max(0,(this.fin??this.reloj())-this.inicio);}
    llegar(){this.secuencia++;return this.cola.InsertaCola({numero:this.secuencia,color:Object.keys(COLORES)[Math.floor(this.aleatorio()*6)]});}
    iniciar(){this.cola=new Cola(5);this.pintados=0;this.secuencia=0;this.terminado=false;this.inicio=this.reloj();this.proxima=this.inicio+20;this.fin=null;this.ultimo=null;this.llegar();}
    actualizar(){while(!this.terminado&&this.reloj()>=this.proxima){const t=this.proxima;this.llegar();if(this.cola.cantidad===5){this.terminado=true;this.fin=t;}else this.proxima+=this.intervalo;}}
    pintar(color){this.actualizar();if(this.terminado)throw Error('La partida terminó al acumular cinco coches.');const c=this.cola.primero();if(c.color!==color)throw Error(`Color incorrecto. El primer coche solicita ${c.color}.`);this.ultimo=this.cola.EliminaCola();this.pintados++;this.proxima=Math.min(this.proxima,this.reloj()+this.intervalo);return c;}
  }
  return {Nodo,ListaDoble,Pila,Cola,ColaCircularDoble,texto,entero,decimal,centavos,normalizar,invertir,palindromo,sumarGrandes,reemplazar,JuegoCoches,COLORES};
})();
