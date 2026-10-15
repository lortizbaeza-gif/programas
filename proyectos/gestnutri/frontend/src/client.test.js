import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockClient } from './client.js';
import { emptyPatient, initialPatients, validate } from './patients.js';
test('flujo local: acceso, búsqueda, alta, edición y detalle', async () => {
 const client = createMockClient({ delay: 0 });
 assert.equal(await client.login(), true);
 assert.equal((await client.list('ANA')).length, 1);
 assert.equal((await client.list('inexistente')).length, 0);
 const saved = await client.save({ ...emptyPatient(), first_name: 'Persona', last_name: 'Ficticia', phone: '+12025550123' });
 assert.equal(saved.birth_date, null);
 const edited = await client.save({ ...saved, allergies: 'Texto ficticio', email: '' }, saved.id);
 assert.equal(edited.id, saved.id);
 assert.equal(edited.created_at, saved.created_at);
 assert.equal((await client.detail(saved.id)).allergies, 'Texto ficticio');
 assert.equal((await client.list()).length, 2);
 assert.equal((await createMockClient({ delay: 0 }).list()).length, 1);
});
test('escenarios controlados y errores sin escrituras parciales', async () => {
 const client = createMockClient({ delay: 0 });
 await assert.rejects(client.login('error'));
 await assert.rejects(client.list('', 'error'));
 assert.deepEqual(await client.list('', 'empty'), []);
 assert.equal(await client.detail(initialPatients[0].id, 'missing'), null);
 await assert.rejects(client.save(emptyPatient()));
 await assert.rejects(client.save(initialPatients[0], undefined, 'error'));
 assert.equal((await client.list()).length, 1);
});
test('reglas visuales provisionales y campos de solo lectura', async () => {
 assert.deepEqual(validate(initialPatients[0]), {});
 const invalid = { ...initialPatients[0], first_name: ' ', phone: '123', birth_date: '2025-02-30', email: 'invalido' };
 assert.deepEqual(Object.keys(validate(invalid)).sort(), ['birth_date','email','first_name','phone']);
 assert.ok(validate({ ...initialPatients[0], restrictions: 'a'.repeat(2001) }).restrictions);
 const client = createMockClient({ delay: 0 });
 const saved = await client.save({ ...initialPatients[0], id: 'inventado', extra: 'descartar' });
 assert.notEqual(saved.id, 'inventado');
 assert.equal('extra' in saved, false);
});
