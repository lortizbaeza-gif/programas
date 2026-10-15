import { initialPatients, fields, patientName, validate } from './patients.js';
// Adaptador exclusivamente local: sin fetch, endpoints ni persistencia.
export function createMockClient({ delay = 450 } = {}) {
  let patients = structuredClone(initialPatients);
  async function wait(scenario) {
    await new Promise(resolve => setTimeout(resolve, delay));
    if (scenario === 'error') throw new Error('Ocurrió un error simulado. Intenta nuevamente.');
  }
  return {
    async login(scenario) { await wait(scenario); return true; },
    async list(query = '', scenario) { await wait(scenario); return scenario === 'empty' ? [] : structuredClone(patients.filter(p => `${patientName(p)} ${p.phone} ${p.email}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()))); },
    async detail(id, scenario) { await wait(scenario); return scenario === 'missing' ? null : structuredClone(patients.find(p => p.id === id) ?? null); },
    async save(values, id, scenario) {
      await wait(scenario);
      const data = Object.fromEntries(fields.map(f => [f.key, f.key === 'birth_date' ? values[f.key] || null : (values[f.key] ?? '').trim()]));
      const errors = validate(data);
      if (Object.keys(errors).length) throw Object.assign(new Error('Revisa los campos indicados.'), { errors });
      const previous = id ? patients.find(p => p.id === id) : null;
      if (id && !previous) throw new Error('No se encontró el paciente.');
      const now = new Date().toISOString();
      const patient = { ...data, id: previous?.id ?? crypto.randomUUID(), created_at: previous?.created_at ?? now, updated_at: now };
      patients = previous ? patients.map(p => p.id === id ? patient : p) : [...patients, patient];
      return structuredClone(patient);
    },
  };
}
export const client = createMockClient();
