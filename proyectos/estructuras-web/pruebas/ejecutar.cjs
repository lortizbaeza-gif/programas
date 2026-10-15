const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../dist/estructuras.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'pruebas.js'),'utf8'));
for(const r of globalThis.resultadoPruebas)console.log(`${r.ok?'OK':'ERROR'} ${r.nombre}${r.error?' / '+r.error:''}`);
const fallos=globalThis.resultadoPruebas.filter(r=>!r.ok);
console.log(`\n${globalThis.resultadoPruebas.length-fallos.length}/${globalThis.resultadoPruebas.length} pruebas aprobadas.`);
process.exitCode=fallos.length?1:0;
