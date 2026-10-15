import { fields } from './patients.js';
export function createApiClient(fetcher = fetch) {
  let csrfToken;
  async function api(path, { method = 'GET', body } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      if (!csrfToken) csrfToken = (await api('auth/csrf/')).csrfToken;
      headers['X-CSRFToken'] = csrfToken;
    }
    const response = await fetcher(`/api/v1/${path}`, { method, headers, credentials: 'include', body: body === undefined ? undefined : JSON.stringify(body) });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const errors = Object.fromEntries(Object.entries(data ?? {}).filter(([key]) => fields.some(f => f.key === key)).map(([key, value]) => [key, Array.isArray(value) ? value.join(' ') : String(value)]));
      throw Object.assign(new Error(data?.detail || data?.non_field_errors?.join(' ') || (Object.keys(errors).length ? 'Revisa los campos indicados.' : `Error HTTP ${response.status}. Intenta nuevamente.`)), { status: response.status, data, errors });
    }
    return data;
  }
  return {
    async restore() {
      try { const user = await api('auth/me/'); csrfToken = (await api('auth/csrf/')).csrfToken; return user; }
      catch (error) { if ([401,403].includes(error.status)) return null; throw error; }
    },
    async login({ username, password }) {
      csrfToken = (await api('auth/csrf/')).csrfToken;
      const result = await api('auth/login/', { method: 'POST', body: { username, password } });
      csrfToken = result.csrfToken;
      return result.user;
    },
    async logout() { await api('auth/logout/', { method: 'POST' }); csrfToken = undefined; },
    list(query = '', page = 1) { return api(`patients/?${new URLSearchParams({ search: query.trim(), page: String(page) })}`); },
    async detail(id) { try { return await api(`patients/${encodeURIComponent(id)}/`); } catch (error) { if (error.status === 404) return null; throw error; } },
    save(values, id) {
      const body = Object.fromEntries(fields.map(f => [f.key, f.key === 'birth_date' ? values[f.key] || null : (values[f.key] ?? '').trim()]));
      return api(id ? `patients/${encodeURIComponent(id)}/` : 'patients/', { method: id ? 'PATCH' : 'POST', body });
    },
  };
}
