import { client as mock } from './client.js';
import { createApiClient } from './api-client.js';
export const apiMode = import.meta.env.VITE_DATA_MODE === 'api';
export const client = apiMode ? createApiClient() : {
 ...mock,
 async list(query, page, scenario) { const results = await mock.list(query, scenario); return { results, count: results.length, next: null, previous: null }; },
 login: (credentials, scenario) => mock.login(scenario),
 restore: async () => null,
 logout: async () => {},
};
