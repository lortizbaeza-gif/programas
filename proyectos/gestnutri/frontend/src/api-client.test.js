import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from './api-client.js';
import { initialPatients } from './patients.js';
function fixture(responses) {
 const calls = [];
 return { calls, client: createApiClient(async (url, options) => {
  calls.push({ url, ...options });
  const [status, body] = responses.shift();
  return { status, ok: status < 400, json: async () => body };
 }) };
}
test('cookies, CSRF inicial y rotación en login; logout 204', async () => {
 const { client, calls } = fixture([[200,{csrfToken:'before'}],[200,{user:{username:'prueba'},csrfToken:'after'}],[204,null]]);
 await client.login({username:'prueba',password:'ficticia'});
 await client.logout();
 assert.equal(calls[1].headers['X-CSRFToken'],'before');
 assert.equal(calls[2].headers['X-CSRFToken'],'after');
 assert.ok(calls.every(c => c.credentials === 'include'));
 assert.equal(calls[2].url,'/api/v1/auth/logout/');
});
test('paginación y búsqueda; PATCH excluye campos de solo lectura', async () => {
 const { client, calls } = fixture([[200,{count:1,results:initialPatients,next:null,previous:null}],[200,{csrfToken:'token'}],[200,initialPatients[0]]]);
 assert.equal((await client.list('Ana María',2)).results.length,1);
 assert.match(calls[0].url,/page=2/);
 await client.save({...initialPatients[0],owner:1},initialPatients[0].id);
 assert.equal(calls[2].method,'PATCH');
 const body=JSON.parse(calls[2].body);
 for (const field of ['id','created_at','updated_at','owner']) assert.equal(field in body,false);
});
test('errores por campo, 404, sesión expirada y fallos de red', async () => {
 const { client }=fixture([[200,{csrfToken:'token'}],[400,{phone:['Formato inválido.'],non_field_errors:['Revisar datos.']}],[404,{detail:'No encontrado'}],[403,{detail:'Sesión requerida'}]]);
 await assert.rejects(client.save(initialPatients[0]), e => e.status===400 && e.errors.phone==='Formato inválido.');
 assert.equal(await client.detail('missing'),null);
 assert.equal(await client.restore(),null);
 await assert.rejects(createApiClient(async () => {throw new Error('Red no disponible');}).restore(),/Red no disponible/);
});
test('recuperar sesión obtiene un nuevo CSRF antes de escribir', async () => {
 const { client,calls }=fixture([[200,{username:'prueba'}],[200,{csrfToken:'restored'}],[200,initialPatients[0]]]);
 assert.equal((await client.restore()).username,'prueba');
 await client.save(initialPatients[0],initialPatients[0].id);
 assert.equal(calls[2].headers['X-CSRFToken'],'restored');
});
