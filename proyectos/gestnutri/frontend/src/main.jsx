import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { client, apiMode } from './data-client.js';
import { emptyPatient, fields, patientName, validate } from './patients.js';
import './styles.css';
function App() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [restoring, setRestoring] = useState(apiMode);
  const [session, setSession] = useState(false);
  const [view, setView] = useState('list');
  const [id, setId] = useState(null);
  const [scenario, setScenario] = useState('normal');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [patient, setPatient] = useState(null);
  const [values, setValues] = useState(emptyPatient);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const heading = useRef(null);
  useEffect(() => {
    let active = true;
    if (apiMode) client.restore().then(user => { if (active) setSession(Boolean(user)); }).catch(error => { if (active) setMessage(error.message); }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [view, session]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    setStatus('loading'); setMessage(''); setErrors({});
    const work = view === 'list' ? client.list(query, page, scenario) : view === 'new' ? Promise.resolve(emptyPatient()) : client.detail(id, scenario);
    work.then(result => {
      if (!active) return;
      if (view === 'list') { setRows(result.results); setPagination(result); }
      else if (view === 'new') setValues(result);
      else { setPatient(result); if (result) setValues(result); }
      setStatus(view !== 'list' && view !== 'new' && !result ? 'missing' : 'ready');
    }).catch(error => { if (active) { setMessage(error.message); setStatus('error'); if (apiMode && [401,403].includes(error.status) && !String(error.data?.detail).includes('CSRF')) setSession(false); } });
    return () => { active = false; };
  }, [session, view, id, query, page, scenario, retry]);
  function navigate(next, selected = null) { setView(next); setId(selected); setPage(1); setNotice(''); }
  async function login(event) {
    event.preventDefault(); setStatus('loading'); setMessage('');
    try { await client.login(credentials, scenario); setCredentials({ username: credentials.username, password: '' }); setSession(true); setView('list'); } catch (error) { setMessage(error.message); setStatus('error'); }
  }
  async function save(event) {
    event.preventDefault();
    const found = validate(values); setErrors(found);
    if (Object.keys(found).length) { setMessage('Revisa los campos indicados.'); event.currentTarget.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus(); return; }
    setStatus('saving'); setMessage('');
    try { const saved = await client.save(values, view === 'edit' ? id : null, scenario); navigate('detail', saved.id); setNotice('Paciente guardado correctamente.'); }
    catch (error) { setErrors(error.errors ?? {}); setMessage(error.message); setStatus('ready'); }
  }
  async function logout() {
    setStatus('loading'); setMessage('');
    try { await client.logout(); setSession(false); setStatus('idle'); setNotice(''); setCredentials({ username: '', password: '' }); }
    catch (error) { setMessage(error.message); setStatus('ready'); }
  }
  const busy = restoring || status === 'loading' || status === 'saving';
  return <><header><a className="brand" href="#" onClick={e => { e.preventDefault(); if (session) navigate('list'); }}>◉ GestNutri</a><span>Gestión de pacientes · Sprint 1</span>{session && <button disabled={busy} onClick={logout}>Salir</button>}</header>
    <main>{!apiMode && <aside className="demo"><strong>Demostración con datos ficticios</strong><span>Campos y reglas provisionales de Diana. API pendiente de aprobación.</span><label>Escenario visual <select value={scenario} onChange={e => setScenario(e.target.value)} disabled={status === 'saving'}><option value="normal">Normal</option><option value="error">Error</option><option value="empty">Lista vacía</option><option value="missing">Expediente no encontrado</option></select></label></aside>}
    <section className="panel"><div className="title"><div><p className="eyebrow">ESPACIO DE NUTRICIÓN</p><h1 tabIndex="-1" ref={heading}>{!session ? 'Bienvenida a GestNutri' : { list: 'Pacientes', new: 'Nuevo paciente', edit: 'Editar paciente', detail: 'Expediente básico' }[view]}</h1></div>{session && view !== 'list' && <button onClick={() => navigate('list')}>Volver a pacientes</button>}</div>
    {notice && <p role="status" className="success">{notice}</p>}{message && <p role="alert" className="error">{message}</p>}
    {!session ? <form onSubmit={login} className="login">{apiMode ? <><p>Inicia sesión con tu cuenta local de integración.</p><label>Usuario<input name="username" autoComplete="username" required value={credentials.username} disabled={busy} onChange={e => setCredentials({ ...credentials, username: e.target.value })}/></label><label>Contraseña<input name="password" type="password" autoComplete="current-password" required value={credentials.password} disabled={busy} onChange={e => setCredentials({ ...credentials, password: e.target.value })}/></label></> : <p>Recorre el flujo con datos ficticios en una sesión simulada.</p>}<button className="primary" disabled={busy}>{restoring ? 'Recuperando sesión…' : busy ? 'Iniciando…' : apiMode ? 'Iniciar sesión' : 'Simular inicio de sesión'}</button></form> : <>
    {view === 'list' && <div className="toolbar"><label className="search">Buscar pacientes<input type="search" value={query} maxLength={150} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Nombre, teléfono o correo" /></label><button className="primary" onClick={() => navigate('new')}>+ Nuevo paciente</button></div>}
    {status === 'loading' && <p role="status">Cargando…</p>}
    {status === 'error' && <button onClick={() => setRetry(n => n + 1)}>Reintentar</button>}
    {status === 'missing' && <p role="status">No se encontró el paciente.</p>}
    {status === 'ready' && view === 'list' && (rows.length ? <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Contacto</th><th>Acciones</th></tr></thead><tbody>{rows.map(p => <tr key={p.id}><td><strong>{patientName(p)}</strong><small>{apiMode ? 'Paciente' : 'Paciente ficticio'}</small></td><td>{p.phone}<small>{p.email || 'Correo no informado'}</small></td><td><button onClick={() => navigate('detail', p.id)} aria-label={`Ver expediente de ${patientName(p)}`}>Ver expediente</button> <button onClick={() => navigate('edit', p.id)} aria-label={`Editar a ${patientName(p)}`}>Editar</button></td></tr>)}</tbody></table></div> : <div className="empty"><h2>No hay pacientes para mostrar</h2><p>{query ? 'Prueba con otra búsqueda.' : 'Puedes agregar tu primer paciente.'}</p></div>)}
    {status === 'ready' && view === 'list' && <nav aria-label="Paginación" className="actions"><span>{pagination.count} pacientes · Página {page}</span><button disabled={!pagination.previous} onClick={() => setPage(p => p - 1)}>Anterior</button><button disabled={!pagination.next} onClick={() => setPage(p => p + 1)}>Siguiente</button></nav>}
    {(status === 'ready' || status === 'saving') && (view === 'new' || view === 'edit') && <form onSubmit={save} noValidate><p>Los campos con * son obligatorios según el contrato de integración.</p><div className="form-grid">{fields.map(f => <label key={f.key} className={f.multiline ? 'wide' : ''}>{f.label}{f.required ? ' *' : ''}{React.createElement(f.multiline ? 'textarea' : 'input', { name: f.key, type: f.type || 'text', value: values[f.key] ?? '', required: f.required, disabled: busy, 'aria-invalid': Boolean(errors[f.key]), 'aria-describedby': errors[f.key] ? `${f.key}-error` : undefined, onChange: e => setValues({ ...values, [f.key]: e.target.value }) })}{errors[f.key] && <span id={`${f.key}-error`} className="field-error">{errors[f.key]}</span>}</label>)}</div><div className="actions"><button type="button" disabled={busy} onClick={() => navigate('list')}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar paciente'}</button></div></form>}
    {status === 'ready' && view === 'detail' && patient && <><h2>{patientName(patient)}</h2><dl className="details">{fields.map(f => <div key={f.key}><dt>{f.label}</dt><dd>{patient[f.key] || 'No informado'}</dd></div>)}</dl><button className="primary" onClick={() => navigate('edit', id)}>Editar paciente</button></>}
    </>}</section><footer>{apiMode ? 'GestNutri · Integración local con API de PR #9' : 'GestNutri · Datos locales en memoria. Los cambios se restablecen al recargar.'}</footer></main></>;
}
createRoot(document.getElementById('root')).render(<App />);
