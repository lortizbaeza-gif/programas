/* Interfaz web: menús por ruta, formularios validados y resultados en pantalla. */
(() => {
  'use strict';
  const E=globalThis.ED;
  const $=selector=>document.querySelector(selector);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dinero=c=>(c/100).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
  const fecha=ms=>new Date(ms).toLocaleString('es-MX',{hour12:false});
  const equipos=['Genny Navarrete Aguilar','Diana Bojorques Cetina','Luisa Fernanda Ortiz Baeza','Alex Dionisio Rojas'];
  const opciones=[
    ['L1','Productos disponibles y retirados','listas','Registra productos y mueve los retirados a su propia lista.'],
    ['L2','Pares e impares','listas','Genera una lista de números y clasifícalos por paridad.'],
    ['L3','Aprobados y reprobados','listas','Registra calificaciones y separa a los alumnos con notas menores a siete.'],
    ['L4','Ordenar productos','listas','Agrega una compra, elimina por clave y consulta su total.'],
    ['L5','Palabras por inicial','listas','Una lista nueva para cada letra que aparezca.'],
    ['P1','Invertir palabra','pilas','Apila los caracteres y observa cómo salen en orden inverso.'],
    ['P2','Palíndromo','pilas','Comprueba si una palabra, número o frase se lee igual en ambos sentidos.'],
    ['P3','Sumar números grandes','pilas','Suma enteros de hasta 10 000 dígitos mediante pilas de cifras.'],
    ['P4','Reemplazar valor','pilas','Sustituye valores de una pila conservando el orden de los demás elementos.'],
    ['C1','Ventanilla de banco','colas','Asigna turnos, forma la fila y atiende en orden de llegada.'],
    ['C2','Pintar coches','colas','Un taller, una paleta y una cola que no puede llegar a cinco coches.'],
    ['C3','Estacionamiento','colas','Controla entradas y salidas con una cola circular doblemente ligada.']
  ];
  const movimientos=['Pago de servicio','Depósito','Retiro','Compra de tiempo aire','Consulta de saldo'];
  let route='inicio',secuencia=0,turno=0,jugando=false,juegoGuardado=false,toastTimer;
  const estado={disponibles:new E.ListaDoble(),retirados:new E.ListaDoble(),numeros:new E.ListaDoble(),pares:new E.ListaDoble(),impares:new E.ListaDoble(),aprobados:new E.ListaDoble(),reprobados:new E.ListaDoble(),compra:new E.ListaDoble(),palabras:new E.ListaDoble(),grupos:new Map(),pila:new E.Pila(),banco:new E.Cola(5),parking:new E.ColaCircularDoble(),invertida:null,palindromo:null,suma:null,reciboBanco:null,reciboAuto:null};
  const juego=new E.JuegoCoches();let mensajeJuego='Inicia una partida y selecciona el color del primer coche.';
  let record={pintados:0,tiempo:0};let avisoRecord='';
  try{const r=JSON.parse(localStorage.getItem('ed-u2-record-v1')||'null');if(r&&Number.isSafeInteger(r.pintados)&&r.pintados>=0&&Number.isFinite(r.tiempo)&&r.tiempo>=0)record=r;}catch{avisoRecord='El navegador no permite guardar el récord; se conservará sólo en esta sesión.';}
  function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3500);}
  function field(label,name,placeholder='',attrs=''){return `<label class="field">${label}<input name="${name}" id="${name}" placeholder="${esc(placeholder)}" ${attrs}></label>`;}
  const form=(id,contenido,boton)=>`<form id="${id}" novalidate>${contenido}<div class="actions"><button class="btn" type="submit">${boton}</button></div></form>`;
  const action=(texto,act,clase='secondary')=>`<button type="button" class="btn ${clase}" data-act="${act}">${texto}</button>`;
  const metrics=items=>`<div class="metric-row">${items.map(([l,v])=>`<div class="metric">${l}<strong>${esc(v)}</strong></div>`).join('')}</div>`;
  function table(headers,rows,vacio='Todavía no hay registros.'){if(!rows.length)return `<div class="empty"><strong>${vacio}</strong>Los resultados aparecerán aquí al completar el formulario.</div>`;return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(f=>`<tr>${f.map(c=>`<td title="${esc(c)}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
  const panel=(title,body,tag='')=>`<section class="panel"><div class="result-heading"><h2>${title}</h2>${tag?`<span class="tag">${tag}</span>`:''}</div>${body}</section>`;
  const chips=(lista,mint=false)=>`<div class="chip-list">${[...lista].map(n=>`<span class="chip ${mint?'mint':''}">${esc(n)}</span>`).join('')||'<p class="hint">Lista vacía</p>'}</div>`;
  const explanation=t=>`<div class="explanation"><h3>¿Qué estructura estamos usando?</h3><p>${t}</p></div>`;
  const totalCompra=()=>[...estado.compra].reduce((t,p)=>t+p.precio,0);
  const productosTabla=lista=>table(['Clave','Producto','Unidades','Precio'],[...lista].map(p=>[p.clave,p.nombre,p.cantidad,dinero(p.precio)]));
  const productoInput=()=>field('Clave única','clave','P01','maxlength="20"')+field('Nombre del producto','nombre','Arroz','maxlength="80"')+field('Precio por producto','precio','25.20','inputmode="decimal"');
  function nav(){ $('#navegacion').innerHTML=`<a class="nav-link ${route==='inicio'?'active':''}" href="#inicio"><span class="nav-number">⌂</span>Inicio</a>`+['listas','pilas','colas'].map(g=>`<div class="nav-group"><div class="nav-title">${g.toUpperCase()}</div>${opciones.filter(o=>o[2]===g).map(o=>`<a class="nav-link ${route===o[0]?'active':''}" ${route===o[0]?'aria-current="page"':''} href="#${o[0]}"><span class="nav-number">${o[0]}</span>${o[1]}</a>`).join('')}</div>`).join('');}
  function inicio(){return `<section class="hero"><p class="eyebrow">APRENDER HACIENDO</p><h1>Los datos tienen<br>su propia <em>estructura.</em></h1><p class="lead">Explora listas, pilas y colas con doce ejercicios interactivos. Agrega, organiza y transforma datos mientras ves cada resultado.</p><div class="hero-bottom"><a class="btn" href="#L1">Comenzar la práctica <span aria-hidden="true">↗</span></a><span class="pill">12 ejercicios · 3 estructuras · 1 laboratorio</span></div><div class="hero-visual" aria-label="Lista doblemente ligada con los valores 10, 20 y 30"><div class="caption"><strong>Todo está conectado.</strong>Cada nodo guarda un dato y los enlaces que le dan orden.</div><div class="node-demo"><div class="demo-node"><span>ANT · DATO · SIG</span>10</div><span class="demo-arrow" aria-hidden="true">⇄</span><div class="demo-node"><span>ANT · DATO · SIG</span>20</div><span class="demo-arrow" aria-hidden="true">⇄</span><div class="demo-node"><span>ANT · DATO · SIG</span>30</div></div></div></section><div class="section-title"><h2>Elige una estructura</h2><span>Empieza donde quieras</span></div><section class="category-grid"><a class="category" href="#L1" style="--accent:#a18abb"><div class="index">01</div><h3>Listas</h3><p>Datos conectados que crecen, se ordenan y se clasifican.</p><div class="link">Explorar 5 ejercicios <span>↗</span></div></a><a class="category" href="#P1" style="--accent:#80aa93"><div class="index">02</div><h3>Pilas</h3><p>El último en entrar es el primero en salir. Así funciona LIFO.</p><div class="link">Explorar 4 ejercicios <span>↗</span></div></a><a class="category" href="#C1" style="--accent:#cfaa83"><div class="index">03</div><h3>Colas</h3><p>Cada elemento espera su turno. El primero en llegar sale primero.</p><div class="link">Explorar 3 ejercicios <span>↗</span></div></a></section><section id="equipo" class="team"><h2>Un proyecto en equipo</h2><p>Estructura de Datos · Unidad II · Octubre de 2026</p><div class="team-names">${equipos.map((n,i)=>`<span><span class="avatar">${['GN','DB','LO','AR'][i]}</span>${n}</span>`).join('')}</div></section>`;}
  function contenido(){
    switch(route){
    case 'L1':return [
      '<h2>Registrar productos</h2>'+form('generarProductos',field('Productos nuevos','cantidad','3','inputmode="numeric" value="3"')+'<p class="hint">Nombres automáticos. Cantidad de 1 a 50 unidades y precio de $1.00 a $500.00.</p><br>','Generar productos')+'<div class="divider"></div><h2>Retirar producto</h2>'+form('retirarProducto',field('Clave del producto','retirar','2'),'Mover a retirados'),
      panel('Productos disponibles',productosTabla(estado.disponibles)+metrics([['Registros',estado.disponibles.cantidad],['Unidades',[...estado.disponibles].reduce((s,p)=>s+p.cantidad,0)]]),'LISTA DOBLE')+panel('Productos retirados',productosTabla(estado.retirados)+metrics([['Registros',estado.retirados.cantidad],['Unidades',[...estado.retirados].reduce((s,p)=>s+p.cantidad,0)]])),
      'Cada producto es un objeto dentro de una lista doblemente ligada. Al retirarlo, se extrae de disponibles y se agrega a retirados.'];
    case 'L2':return [
      '<h2>Generar números</h2>'+form('generarNumeros',field('Cantidad de números','cantidad','10','value="10" inputmode="numeric"')+field('Mínimo','minimo','-10','value="-10" inputmode="numeric"')+field('Máximo','maximo','10','value="10" inputmode="numeric"'),'Generar y clasificar')+'<p class="hint">De 1 a 1000 números. Incluye negativos, cero y valores repetidos.</p>',
      panel('Lista original',chips(estado.numeros),`${estado.numeros.cantidad} NÚMEROS`)+panel('Números pares',chips(estado.pares,true),`${estado.pares.cantidad} PARES`)+panel('Números impares',chips(estado.impares),`${estado.impares.cantidad} IMPARES`),
      'Recorremos la lista original y evaluamos número % 2. Residuo cero va a pares; el resto a impares. Cada destino es otra lista enlazada.'];
    case 'L3':return [
      '<h2>Registrar alumno</h2>'+form('registrarAlumno',field('Nombre completo','nombre','Ana López','maxlength="80"')+field('Calificación','nota','8.5','inputmode="decimal"'),'Registrar y clasificar')+'<p class="hint">Notas de 0 a 10. Con 7 o más se aprueba.</p>',
      panel('Alumnos aprobados',table(['Alumno','Calificación'],[...estado.aprobados].map(a=>[a.nombre,a.nota])),'7 O MÁS')+panel('Alumnos reprobados',table(['Alumno','Calificación'],[...estado.reprobados].map(a=>[a.nombre,a.nota])),'MENOR QUE 7'),
      'Todos ingresan a la lista inicial. Una nota menor a 7 provoca la extracción del alumno y su traslado a la lista de reprobados.'];
    case 'L4':return [
      '<h2>Agregar a la compra</h2>'+form('agregarCompra',productoInput(),'Agregar producto')+'<div class="divider"></div><h2>Eliminar por clave</h2>'+form('eliminarCompra',field('Clave a eliminar','claveEliminar','P01','maxlength="20"'),'Eliminar producto'),
      panel('Productos de la compra',productosTabla(estado.compra)+`<div class="total"><span>Total de compra</span><strong>${dinero(totalCompra())}</strong></div>`,'ORDEN POR NOMBRE'),
      'La compra se guarda en una lista doble. El ordenamiento por inserción modifica los enlaces. Los precios se manejan en centavos enteros para sumar sin errores de punto flotante.'];
    case 'L5':return [
      '<h2>Agregar palabra</h2>'+form('agregarPalabra',field('Una palabra','palabra','Fresa','maxlength="80"'),'Agregar a su lista')+'<p class="hint">Sólo letras. Las mayúsculas y tildes no separan la misma inicial.</p>',
      panel('Lista original',chips(estado.palabras))+panel('Listas por inicial',[...estado.grupos].sort(([a],[b])=>a.localeCompare(b,'es')).map(([letra,lista])=>`<div class="group-row"><span class="group-letter">${esc(letra)}</span>${chips(lista,true)}</div>`).join('')||'<p class="hint">Cada inicial nueva creará su propia lista.</p>'),
      'Una colección de grupos asocia cada inicial con su lista enlazada. Agregar una letra que no existe crea un grupo automáticamente.'];
    case 'P1':return [
      '<h2>Invertir con una pila</h2>'+form('invertir',field('Palabra','palabra','UTM','maxlength="2000"'),'Invertir palabra'),
      panel('Resultado',estado.invertida?`<p class="result-label">Palabra original</p><p>${esc(estado.invertida.original)}</p><p class="result-label">Orden inverso</p><div class="big-result">${esc(estado.invertida.resultado)}</div>`:'<div class="empty"><strong>Del último al primero.</strong>Prueba con UTM para obtener MTU.</div>','LIFO'),
      'Cada carácter se apila. Después desapilamos hasta vaciar la estructura: el último carácter que entró es el primero que sale.'];
    case 'P2':return [
      '<h2>Comprobar texto</h2>'+form('palindromo',field('Palabra, número o frase','palabra','Anita lava la tina','maxlength="2000"'),'Comprobar palíndromo')+'<p class="hint">Ignoramos espacios, signos, tildes y diferencias entre mayúsculas y minúsculas.</p>',
      panel('Resultado',estado.palindromo?`<p class="result-label">Texto normalizado</p><div class="big-result">${esc(estado.palindromo.limpio)}</div><div class="${estado.palindromo.resultado?'success':'failure'}-line">${estado.palindromo.resultado?'Sí es un palíndromo.':'No es un palíndromo.'}</div>`:'<div class="empty"><strong>¿Se lee igual en ambos sentidos?</strong>Prueba con radar o con una frase.</div>','PILA DE CARACTERES'),
      'Normalizamos el texto, lo invertimos utilizando una pila y comparamos las dos versiones. Una cadena formada sólo por signos no se acepta.'];
    case 'P3':return [
      '<h2>Sumar enteros</h2>'+form('sumar',`<label class="field">Primer entero<textarea name="primero" id="primero" maxlength="10001" placeholder="999999999999999999999999999999"></textarea></label><label class="field">Segundo entero<textarea name="segundo" id="segundo" maxlength="10001" placeholder="1"></textarea></label>`,'Sumar con pilas')+'<p class="hint">Hasta 10 000 dígitos por número. Se aceptan signos + y −.</p>',
      panel('Suma exacta',estado.suma!==null?`<p class="result-label">Resultado</p><div class="big-result" id="suma-resultado">${esc(estado.suma)}</div><p class="hint">${estado.suma.replace('-','').length} dígitos en el resultado.</p>`:'<div class="empty"><strong>Un dígito a la vez.</strong>Sin convertir el número completo a Number ni BigInt.</div>','PILAS + ACARREO'),
      'Apilamos cada cifra y operamos desde las unidades, con acarreo. Si los signos difieren, restamos magnitudes con préstamo. Otra pila reconstruye el resultado.'];
    case 'P4':return [
      '<h2>Agregar a la pila</h2>'+form('apilar',field('Valor entero','valor','5','inputmode="numeric"'),'Apilar valor')+`<div class="actions" style="margin-top:10px">${action('Desapilar','desapilar')}</div>`+'<div class="divider"></div><h2>Reemplazar valores</h2>'+form('reemplazar',field('Valor viejo','viejo','5','inputmode="numeric"')+field('Valor nuevo','nuevo','9','inputmode="numeric"'),'Reemplazar coincidencias'),
      panel('Contenido de la pila',`<div class="stack"><div class="stack-label">CIMA · PRIMERO EN SALIR</div>${[...estado.pila].map(n=>`<div class="stack-block">${n}</div>`).join('')||'<p class="hint">Pila vacía</p>'}<div class="stack-base">BASE</div></div>`+metrics([['Elementos',estado.pila.cantidad]]),'LIFO'),
      'Reemplazar(pila, nuevo, viejo) usa una pila auxiliar. Sustituye todas las apariciones del valor viejo y devuelve los elementos en su orden original.'];
    case 'C1':return [
      '<h2>Nuevo cliente</h2>'+form('agregarCliente',field('Nombre del cliente','nombre','Ana López','maxlength="80"')+`<label class="field">Movimiento<select name="movimiento" id="movimiento">${movimientos.map(m=>`<option>${m}</option>`).join('')}</select></label>`,'Asignar turno y formar')+`<div class="actions" style="margin-top:10px">${action('Atender al primero','atenderBanco','mint')}</div><div class="divider"></div>`+form('capacidadBanco',field('Capacidad de la fila','capacidad','5',`value="${estado.banco.capacidad}" inputmode="numeric"`),'Cambiar capacidad')+'<p class="hint">Sólo se puede cambiar con la cola vacía.</p>',
      panel('Clientes en espera',table(['Turno','Cliente','Movimiento','Llegada'],[...estado.banco].map(c=>[c.turno,c.nombre,c.movimiento,fecha(c.llegada)]))+metrics([['En espera',`${estado.banco.cantidad} / ${estado.banco.capacidad}`],['Frente',estado.banco.frente?.dato.turno??'—'],['Final',estado.banco.final?.dato.turno??'—']]),'FIFO')+(estado.reciboBanco?panel('Última atención',`<div class="receipt"><h3>Turno ${estado.reciboBanco.cliente.turno}</h3><p>${esc(estado.reciboBanco.cliente.nombre)} · ${esc(estado.reciboBanco.cliente.movimiento)}</p><p>Llegada: ${fecha(estado.reciboBanco.cliente.llegada)}</p><p>Atención: ${fecha(estado.reciboBanco.salida)}</p><p>Tiempo de espera: <b>${estado.reciboBanco.espera.toFixed(2)} segundos</b></p></div>`):''),
      'InsertaCola agrega al final y EliminaCola retira del frente. ColaLlena y ColaVacia evitan sobreflujo y bajas inválidas. La espera se mide con un reloj monotónico.'];
    case 'C3':return [
      '<h2>Entrada de auto</h2>'+form('agregarAuto',field('Placas','placas','ABC-123','maxlength="20"')+field('Propietario','propietario','Ana López','maxlength="80"'),'Registrar entrada')+`<div class="divider"></div><h2>Salida de auto</h2><p class="hint">La salida corresponde al primero en llegar. Tarifa: <b>$2.00 por segundo</b>, con fracciones.</p><div class="actions" style="margin-top:15px">${action('Registrar salida del primero','salirAuto','mint')}</div>`,
      panel('Autos en el estacionamiento',table(['Placas','Propietario','Entrada'],[...estado.parking].map(a=>[a.placas,a.propietario,fecha(a.entrada)]))+metrics([['Autos',estado.parking.cantidad],['Frente',estado.parking.frente?.dato.placas??'—'],['Final',estado.parking.final?.dato.placas??'—']]),'COLA CIRCULAR DOBLE')+(estado.reciboAuto?panel('Recibo de estacionamiento',`<div class="receipt"><h3>Salida registrada</h3><p><b>${esc(estado.reciboAuto.auto.placas)}</b> · ${esc(estado.reciboAuto.auto.propietario)}</p><p>Entrada: ${fecha(estado.reciboAuto.auto.entrada)}</p><p>Salida: ${fecha(estado.reciboAuto.salida)}</p><p>Duración: ${estado.reciboAuto.segundos.toFixed(3)} segundos</p><p>Tarifa: $2.00 por segundo</p><p>Total: <strong class="price">${dinero(estado.reciboAuto.centavos)}</strong></p></div>`):''),
      'Cada auto ocupa un nodo de una cola circular doblemente ligada, sin límite lógico de cupo. El final enlaza al frente y el frente al final. Se retira siempre el primero.'];
    default:return ['','',''];
    }
  }
  function carSvg(color='#fff'){return `<svg class="car-svg" viewBox="0 0 180 100" aria-hidden="true"><path d="M34 54 53 20h66l25 34" fill="${color}" stroke="#61546d" stroke-width="2.5"/><path d="M48 51 60 28h24v23zm44 0V28h23l17 23z" fill="#d0e3eb" stroke="#61546d" stroke-width="1.5"/><rect x="16" y="52" width="150" height="32" rx="7" fill="${color}" stroke="#61546d" stroke-width="2.5"/><circle cx="49" cy="84" r="14" fill="#42394e"/><circle cx="49" cy="84" r="6" fill="#aea1ba"/><circle cx="135" cy="84" r="14" fill="#42394e"/><circle cx="135" cy="84" r="6" fill="#aea1ba"/></svg>`;}
  function gameMarkup(){return `<div id="error" class="alert" role="alert"></div><div class="game-panel"><div class="game-metrics"><div>Coches pintados<strong id="g-score">0</strong></div><div>Cola de atención<strong id="g-queue">1 / 5</strong></div><div>Tiempo total<strong id="g-time">0.0 s</strong></div><div>Próxima llegada<strong id="g-next">20.0 s</strong></div></div><div id="g-track" class="track" aria-label="Coches en orden de atención"></div><div class="game-status" id="g-message" role="status"></div><p class="result-label">Elige el color del primer coche</p><div class="palette">${Object.entries(E.COLORES).map(([nombre,color])=>`<button data-color="${nombre}" style="background:${color};color:${nombre==='Amarillo'?'#5f501d':'#fff'}">${nombre}</button>`).join('')}</div><div id="g-last"></div><div class="game-bottom">${action('Iniciar / reiniciar partida','iniciarJuego','') }<div id="g-record" class="record"></div></div><p class="game-rules">Un coche al iniciar. Después, llegadas cada 20 s. Cada 3 aciertos, el intervalo baja 2 s hasta un mínimo de 2 s.<br>La partida termina al acumular 5 coches. El récord se guarda en este navegador al finalizar.</p></div>`;}
  function render(){nav();if(route==='inicio'){$('#vista').innerHTML=inicio();return;}const o=opciones.find(o=>o[0]===route);if(!o){route='inicio';render();return;}const head=`<section class="page-heading"><a class="back" href="#inicio">← Volver al laboratorio</a><p class="eyebrow">${o[2]} / EJERCICIO ${o[0]}</p><h1>${o[1]}</h1><p class="lead">${o[3]}</p></section>`;if(route==='C2'){$('#vista').innerHTML=head+gameMarkup();renderJuego();return;}const [formulario,resultados,explicacion]=contenido();$('#vista').innerHTML=head+`<div id="error" class="alert" role="alert"></div><div class="workspace"><section class="panel">${formulario}</section><div class="result-column">${resultados}${explanation(explicacion)}</div></div>`;}
  function fallo(error){const box=$('#error');if(box){box.textContent=error.message||String(error);box.scrollIntoView({block:'nearest',behavior:'smooth'});}else toast(error.message||String(error));}
  function bien(mensaje){render();toast(mensaje);}
  $('#vista').addEventListener('submit',event=>{
    event.preventDefault();const f=event.target;const d=Object.fromEntries(new FormData(f));
    try{
      switch(f.id){
      case 'generarProductos':{const n=E.entero(d.cantidad,1,100);for(let i=0;i<n;i++){secuencia++;estado.disponibles.agregar({clave:String(secuencia),nombre:`producto${secuencia}`,cantidad:1+Math.floor(Math.random()*50),precio:100+Math.floor(Math.random()*49901)});}bien(`${n} productos agregados.`);break;}
      case 'retirarProducto':{const p=estado.disponibles.extraer(p=>p.clave===E.texto(d.retirar));if(!p)throw Error('La clave no existe entre los productos disponibles.');estado.retirados.agregar(p);bien('Producto movido a retirados.');break;}
      case 'generarNumeros':{const n=E.entero(d.cantidad,1,1000),min=E.entero(d.minimo),max=E.entero(d.maximo,min,1000000);estado.numeros=new E.ListaDoble();estado.pares=new E.ListaDoble();estado.impares=new E.ListaDoble();for(let i=0;i<n;i++){const v=min+Math.floor(Math.random()*(max-min+1));estado.numeros.agregar(v);(v%2===0?estado.pares:estado.impares).agregar(v);}bien('Lista generada y clasificada.');break;}
      case 'registrarAlumno':{const a={nombre:E.texto(d.nombre),nota:E.decimal(d.nota)};estado.aprobados.agregar(a);if(a.nota<7)estado.reprobados.agregar(estado.aprobados.extraer(x=>x===a));bien('Alumno registrado y clasificado.');break;}
      case 'agregarCompra':{const clave=E.texto(d.clave,20).toUpperCase();if(estado.compra.buscar(p=>p.clave===clave))throw Error('La clave ya existe. Usa una clave diferente.');const nombre=E.texto(d.nombre),precio=E.centavos(d.precio);if(!Number.isSafeInteger(totalCompra()+precio))throw Error('El total excede la precisión permitida.');estado.compra.agregar({clave,nombre,precio,cantidad:1});estado.compra.ordenar(p=>p.nombre);bien('Producto agregado. Lista ordenada por nombre.');break;}
      case 'eliminarCompra':{const clave=E.texto(d.claveEliminar,20).toUpperCase();if(!estado.compra.extraer(p=>p.clave===clave))throw Error('La clave no existe en la compra.');bien('Producto eliminado. Total actualizado.');break;}
      case 'agregarPalabra':{const p=E.texto(d.palabra);if(!/^\p{L}+$/u.test(p))throw Error('Escribe una sola palabra, sólo con letras.');const letra=E.normalizar([...p][0]).toUpperCase();estado.palabras.agregar(p);if(!estado.grupos.has(letra))estado.grupos.set(letra,new E.ListaDoble());estado.grupos.get(letra).agregar(p);bien(`Palabra agregada a la lista ${letra}.`);break;}
      case 'invertir':{const original=E.texto(d.palabra,2000);estado.invertida={original,resultado:E.invertir(original)};bien('Palabra invertida mediante una pila.');break;}
      case 'palindromo':estado.palindromo=E.palindromo(E.texto(d.palabra,2000));bien('Texto comprobado.');break;
      case 'sumar':estado.suma=E.sumarGrandes(d.primero,d.segundo);bien('Suma calculada por dígitos.');break;
      case 'apilar':estado.pila.apilar(E.entero(d.valor));bien('Valor agregado a la cima.');break;
      case 'reemplazar':{if(!estado.pila.cantidad)throw Error('La pila está vacía.');const n=E.reemplazar(estado.pila,E.entero(d.nuevo),E.entero(d.viejo));bien(`${n} apariciones reemplazadas. El orden se conserva.`);break;}
      case 'agregarCliente':{if(estado.banco.ColaLlena())throw Error('La cola está llena. Atiende un cliente.');const nombre=E.texto(d.nombre);if(!movimientos.includes(d.movimiento))throw Error('Elige un movimiento válido.');turno++;estado.banco.InsertaCola({turno,nombre,movimiento:d.movimiento,llegada:Date.now(),instante:performance.now()});bien(`Cliente agregado. Turno ${turno}.`);break;}
      case 'capacidadBanco':{if(!estado.banco.ColaVacia())throw Error('Primero atiende a todos los clientes.');estado.banco.capacidad=E.entero(d.capacidad,1,1000);bien('Capacidad actualizada.');break;}
      case 'agregarAuto':{const placas=E.texto(d.placas,20).toUpperCase(),propietario=E.texto(d.propietario);if([...estado.parking].some(a=>a.placas===placas))throw Error('Esas placas ya están dentro del estacionamiento.');estado.parking.InsertaCola({placas,propietario,entrada:Date.now(),instante:performance.now()});bien(`Entrada confirmada: ${placas}.`);break;}
      }
    }catch(error){fallo(error);}
  });
  $('#vista').addEventListener('click',event=>{
    const boton=event.target.closest('button');if(!boton)return;
    try{
      if(boton.dataset.color){if(!jugando)throw Error('Inicia una partida primero.');const coche=juego.pintar(boton.dataset.color);mensajeJuego=`¡Coche ${coche.numero} pintado de ${coche.color}!`;renderJuego();return;}
      switch(boton.dataset.act){
      case 'desapilar':{const d=estado.pila.desapilar();bien(`Valor retirado de la cima: ${d}.`);break;}
      case 'atenderBanco':{const cliente=estado.banco.EliminaCola();estado.reciboBanco={cliente,salida:Date.now(),espera:Math.max(0,(performance.now()-cliente.instante)/1000)};bien(`Turno ${cliente.turno} atendido.`);break;}
      case 'salirAuto':{const auto=estado.parking.EliminaCola();const segundos=Math.max(0,(performance.now()-auto.instante)/1000);estado.reciboAuto={auto,salida:Date.now(),segundos,centavos:Math.round(segundos*200)};bien(`Salida de ${auto.placas} registrada.`);break;}
      case 'iniciarJuego':juego.iniciar();jugando=true;juegoGuardado=false;mensajeJuego='Atiende el primer coche. Las llegadas son automáticas.';$('#error').textContent='';renderJuego();break;
      }
    }catch(error){if(route==='C2'){mensajeJuego=error.message;renderJuego();}else fallo(error);}
  });
  function guardarRecord(){if(juegoGuardado)return;juegoGuardado=true;const n={pintados:juego.pintados,tiempo:juego.tiempo};if(n.pintados>record.pintados||(n.pintados===record.pintados&&(!record.tiempo||n.tiempo<record.tiempo))){record=n;try{localStorage.setItem('ed-u2-record-v1',JSON.stringify(record));}catch{avisoRecord='Récord de esta sesión: el navegador no permite guardarlo.';}}}
  function renderJuego(){
    if(route!=='C2'||!$('#g-track'))return;
    $('#g-score').textContent=juego.pintados;$('#g-queue').textContent=`${juego.cola.cantidad} / 5`;
    $('#g-time').textContent=(jugando?juego.tiempo:0).toFixed(1)+' s';$('#g-next').textContent=(juego.terminado?0:jugando?Math.max(0,juego.proxima-juego.reloj()):20).toFixed(1)+' s';
    const firma=[...juego.cola].map(c=>c.numero).join(',');
    if($('#g-track').dataset.firma!==firma){$('#g-track').dataset.firma=firma;$('#g-track').innerHTML=[...juego.cola].map((c,i)=>`<div class="car-item"><div class="car-title ${i===0?'front':''}">${i===0?'ATENDER PRIMERO':`EN ESPERA #${c.numero}`}</div>${carSvg()}<div class="car-color" style="background:${E.COLORES[c.color]};color:${c.color==='Amarillo'?'#5f501d':'#fff'}">${c.color}</div></div>`).join('')||'<div class="empty" style="width:100%"><strong>¡Cola vacía!</strong>Espera la llegada del siguiente coche.</div>';}
    if(juego.terminado)mensajeJuego=`FIN DE PARTIDA · Cinco coches en espera. Pintaste ${juego.pintados} en ${juego.tiempo.toFixed(1)} segundos.`;
    $('#g-message').textContent=mensajeJuego;
    for(const b of document.querySelectorAll('[data-color]'))b.disabled=!jugando||juego.terminado;
    $('#g-last').innerHTML=juego.ultimo?`<div class="last-painted">${carSvg(E.COLORES[juego.ultimo.color])}<span>Último atendido: <b>coche ${juego.ultimo.numero}</b>, pintado de ${juego.ultimo.color}.</span></div>`:'';
    $('#g-record').textContent=`Récord: ${record.pintados} coches · ${record.tiempo.toFixed(1)} s`+(avisoRecord?' · '+avisoRecord:'');
  }
  setInterval(()=>{if(jugando&&!juego.terminado)juego.actualizar();if(jugando&&juego.terminado&&!juegoGuardado){guardarRecord();toast(`Partida terminada: ${juego.pintados} coches pintados.`);}renderJuego();},100);
  function navegar(){const hash=location.hash.slice(1);if(hash==='contenido'){$('#contenido').focus();return;}if(hash==='equipo'){if(route!=='inicio'){route='inicio';render();}$('#equipo')?.scrollIntoView({behavior:'smooth'});return;}route=opciones.some(o=>o[0]===hash)?hash:'inicio';render();window.scrollTo({top:0,behavior:'instant'});}
  window.addEventListener('hashchange',navegar);navegar();
})();
