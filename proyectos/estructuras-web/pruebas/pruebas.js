/* Mismo conjunto de pruebas para navegador y Node.js, sin dependencias. */
globalThis.resultadoPruebas=(()=>{
 const E=globalThis.ED,resultados=[];
 function igual(a,b){if(JSON.stringify(a)!==JSON.stringify(b))throw Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`);}
 function cierto(v){if(!v)throw Error('Condición no satisfecha.');}
 function falla(f){let fallo=false;try{f();}catch{fallo=true;}cierto(fallo);}
 function test(nombre,f){try{f();resultados.push({nombre,ok:true});}catch(e){resultados.push({nombre,ok:false,error:e.message});}}
 test('Lista: agregar y recorrer',()=>{const l=new E.ListaDoble();l.agregar(1);l.agregar(2);igual([...l],[1,2]);igual(l.cantidad,2);});
 test('Lista: enlaces de extremos',()=>{const l=new E.ListaDoble();l.agregar(1);l.agregar(2);cierto(l.cabeza.siguiente.anterior===l.cabeza);igual(l.cabeza.anterior,null);igual(l.cola.siguiente,null);});
 test('Lista: extraer cabeza, centro y cola',()=>{const l=new E.ListaDoble();[1,2,3,4].forEach(x=>l.agregar(x));igual(l.extraer(x=>x===2),2);igual(l.extraer(x=>x===1),1);igual(l.extraer(x=>x===4),4);igual([...l],[3]);});
 test('Lista: vaciar y volver a utilizar',()=>{const l=new E.ListaDoble();l.agregar(1);l.extraer(()=>true);igual(l.cabeza,null);igual(l.cola,null);l.agregar(2);igual([...l],[2]);});
 test('Lista: ordenar estable por nombre',()=>{const l=new E.ListaDoble();[{n:'Zanahoria',i:0},{n:'Arroz',i:1},{n:'Arroz',i:2}].forEach(x=>l.agregar(x));l.ordenar(x=>x.n);igual([...l].map(x=>x.i),[1,2,0]);cierto(l.cola.anterior.siguiente===l.cola);});
 test('Lista: ordenar vacía y buscar inexistente',()=>{const l=new E.ListaDoble();l.ordenar(x=>x);igual(l.buscar(()=>true),null);igual(l.extraer(()=>true),null);});
 test('Pares: negativos y cero',()=>{const p=new E.ListaDoble(),i=new E.ListaDoble();[-3,-2,0,1,4].forEach(n=>(n%2===0?p:i).agregar(n));igual([...p],[-2,0,4]);igual([...i],[-3,1]);});
 test('Calificaciones: 6.99 reprueba y 7 aprueba',()=>{cierto(E.decimal('6.99')<7);cierto(E.decimal('7')>=7);});
 test('Calificaciones: fuera de rango',()=>{falla(()=>E.decimal('11'));falla(()=>E.decimal('-0.1'));});
 test('Palabras: iniciales sin tildes y mayúsculas',()=>{igual(E.normalizar('Árbol')[0],E.normalizar('agua')[0]);igual(E.normalizar('Fresa')[0],'f');});
 test('Pila: orden LIFO',()=>{const p=new E.Pila();[1,2,3].forEach(n=>p.apilar(n));igual(p.desapilar(),3);igual([...p],[2,1]);});
 test('Pila: subflujo',()=>falla(()=>new E.Pila().desapilar()));
 test('Invertir: UTM',()=>igual(E.invertir('UTM'),'MTU'));
 test('Invertir: caracteres acentuados',()=>igual(E.invertir('árbol'),'lobrá'));
 test('Palíndromo: frase, tildes y números',()=>{cierto(E.palindromo('Anita lava la tina').resultado);cierto(E.palindromo('Ána').resultado);cierto(E.palindromo('12321').resultado);});
 test('Palíndromo: negativo y sólo signos',()=>{cierto(!E.palindromo('Python').resultado);falla(()=>E.palindromo('...'));});
 test('Suma: acarreo completo',()=>igual(E.sumarGrandes('999','1'),'1000'));
 test('Suma: enteros con signo',()=>{igual(E.sumarGrandes('-999','1'),'-998');igual(E.sumarGrandes('1','-999'),'-998');igual(E.sumarGrandes('-12','-3'),'-15');});
 test('Suma: cancelación y ceros',()=>{igual(E.sumarGrandes('-15','15'),'0');igual(E.sumarGrandes('000','-0'),'0');igual(E.sumarGrandes('+002','3'),'5');});
 test('Suma: diez mil dígitos',()=>igual(E.sumarGrandes('9'.repeat(10000),'1'),'1'+'0'.repeat(10000)));
 test('Suma: comparación de 200 casos con BigInt sólo como oráculo de prueba',()=>{for(let i=-100;i<100;i++){const a=BigInt(i)*987654321987654321n,b=BigInt(40-i)*123456789123456789n;igual(E.sumarGrandes(String(a),String(b)),String(a+b));}});
 test('Suma: entradas inválidas',()=>{falla(()=>E.sumarGrandes('1.2','3'));falla(()=>E.sumarGrandes('-','1'));falla(()=>E.sumarGrandes('1'.repeat(10001),'0'));});
 test('Reemplazar: todas las coincidencias y orden',()=>{const p=new E.Pila();[5,2,5,8].forEach(n=>p.apilar(n));igual(E.reemplazar(p,9,5),2);igual([...p],[8,9,2,9]);igual(E.reemplazar(p,0,99),0);igual([...p],[8,9,2,9]);});
 test('Cola: FIFO',()=>{const q=new E.Cola(3);q.InsertaCola('Ana');q.InsertaCola('Luis');igual(q.EliminaCola(),'Ana');igual(q.primero(),'Luis');});
 test('Cola: llena y vacía',()=>{const q=new E.Cola(1);cierto(q.ColaVacia());q.InsertaCola(1);cierto(q.ColaLlena());falla(()=>q.InsertaCola(2));q.EliminaCola();igual(q.final,null);falla(()=>q.EliminaCola());});
 test('Circular doble: 50 nodos y enlaces inversos',()=>{const q=new E.ColaCircularDoble();for(let i=0;i<50;i++)q.InsertaCola(i);let n=q.frente;for(let i=0;i<50;i++){cierto(n.siguiente.anterior===n);n=n.siguiente;}cierto(n===q.frente);cierto(q.final.siguiente===q.frente);cierto(q.frente.anterior===q.final);igual([...q].length,50);});
 test('Circular doble: salida FIFO, nodo único y vacío',()=>{const q=new E.ColaCircularDoble();q.InsertaCola(1);q.InsertaCola(2);igual(q.EliminaCola(),1);cierto(q.frente.siguiente===q.frente);cierto(q.frente.anterior===q.frente);q.EliminaCola();cierto(q.ColaVacia());igual(q.final,null);falla(()=>q.EliminaCola());});
 test('Estacionamiento: tarifa y fracciones',()=>{igual(Math.round(12.5*200),2500);igual(Math.round(0.005*200),1);});
 test('Moneda: suma exacta y coma decimal',()=>{igual(E.centavos('0.10')+E.centavos('0,20'),30);igual(E.centavos('12'),1200);});
 test('Moneda: precio negativo, NaN y más de dos decimales',()=>{falla(()=>E.centavos('-1'));falla(()=>E.centavos('NaN'));falla(()=>E.centavos('1.234'));});
 test('Enteros: letras, decimales y rangos',()=>{igual(E.entero('3',1,5),3);falla(()=>E.entero('tres'));falla(()=>E.entero('1.5'));falla(()=>E.entero('6',1,5));});
 test('Texto: vacío y control',()=>{falla(()=>E.texto('  '));falla(()=>E.texto('a\u0000b'));igual(E.texto(' Ana '),'Ana');});
 test('Juego: primer coche y rechazo de color',()=>{let t=0;const j=new E.JuegoCoches(()=>t,()=>0);igual(j.cola.cantidad,1);falla(()=>j.pintar('Azul'));igual(j.cola.cantidad,1);igual(j.pintados,0);});
 test('Juego: acierto FIFO, vaciado y nueva llegada',()=>{let t=0;const j=new E.JuegoCoches(()=>t,()=>0);j.pintar('Rojo');igual(j.pintados,1);igual(j.cola.cantidad,0);falla(()=>j.pintar('Rojo'));t=20;j.actualizar();igual(j.cola.cantidad,1);});
 test('Juego: acelera cada tres y mínimo de dos segundos',()=>{let t=0;const j=new E.JuegoCoches(()=>t,()=>0);for(let i=0;i<33;i++){if(j.cola.ColaVacia()){t=j.proxima;j.actualizar();}j.pintar('Rojo');if(i===2)igual(j.intervalo,18);}igual(j.intervalo,2);});
 test('Juego: fin exacto con cinco coches',()=>{let t=0;const j=new E.JuegoCoches(()=>t,()=>0);t=100;j.actualizar();cierto(j.terminado);igual(j.cola.cantidad,5);igual(j.tiempo,80);falla(()=>j.pintar('Rojo'));});
 test('Juego: reinicio',()=>{let t=0;const j=new E.JuegoCoches(()=>t,()=>0);t=100;j.actualizar();j.iniciar();igual(j.pintados,0);igual(j.cola.cantidad,1);cierto(!j.terminado);igual(j.tiempo,0);});
 return resultados;
})();
if(typeof document!=='undefined'){
 const lista=document.getElementById('resultados');
 for(const r of resultadoPruebas){const li=document.createElement('li');li.textContent=(r.ok?'OK · ':'ERROR · ')+r.nombre+(r.error?' / '+r.error:'');li.style.color=r.ok?'#24785c':'#a14259';lista.append(li);}
 document.getElementById('resumen').textContent=`${resultadoPruebas.filter(r=>r.ok).length} de ${resultadoPruebas.length} pruebas aprobadas`;
}
