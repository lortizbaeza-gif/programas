import React, { useEffect, useState } from "react";
import { api } from "./api";
import backlog from "../../orchestrator/backlog.json";
const blankPatient = {
  name: "",
  birth_date: "",
  phone: "",
  allergies: "",
  preferences: "",
  restrictions: "",
};
const today = () => new Date().toLocaleDateString("sv-SE");
const initialMeasurements = () => [
  { kind: "weight", value: "", unit: "kg", method: "" },
  { kind: "fat", value: "", unit: "%", method: "" },
  { kind: "muscle", value: "", unit: "%", method: "" },
];
const labels = { weight: "Peso", fat: "Grasa corporal", muscle: "Músculo" };
const formatDate = (value) =>
  new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
    new Date(value + "T12:00:00"),
  );
function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [section, setSection] = useState("patients"),
    [credentials, setCredentials] = useState({ username: "", password: "" });
  const [patients, setPatients] = useState([]),
    [count, setCount] = useState(0),
    [page, setPage] = useState(1),
    [query, setQuery] = useState(""),
    [appliedQuery, setAppliedQuery] = useState("");
  const [selected, setSelected] = useState(null),
    [patientForm, setPatientForm] = useState(blankPatient),
    [editing, setEditing] = useState(false),
    [history, setHistory] = useState([]);
  const [date, setDate] = useState(today()),
    [notes, setNotes] = useState(""),
    [measurements, setMeasurements] = useState(initialMeasurements()),
    [before, setBefore] = useState(""),
    [after, setAfter] = useState(""),
    [comparison, setComparison] = useState(null);
  async function perform(action) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadPatients(term = appliedQuery, p = page) {
    const data = await api(
      `/patients/?search=${encodeURIComponent(term)}&page=${p}`,
    );
    setPatients(data.results);
    setCount(data.count);
    setPage(p);
    setAppliedQuery(term);
  }
  async function loadHistory(patient) {
    const data = await api(`/patients/${patient.id}/history/`);
    setHistory(data);
    setBefore(data.length > 1 ? String(data[data.length - 1].id) : "");
    setAfter(data.length ? String(data[0].id) : "");
    setComparison(null);
  }
  useEffect(() => {
    api("/me/")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (user) perform(() => loadPatients("", 1));
  }, [user]);
  async function login(e) {
    e.preventDefault();
    await perform(async () => {
      const result = await api("/login/", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      setUser(result);
      setCredentials({ username: "", password: "" });
    });
  }
  async function openPatient(patient) {
    await perform(async () => {
      const detail = await api(`/patients/${patient.id}/`);
      const visits = await api(`/patients/${patient.id}/history/`);
      setSelected(detail);
      setEditing(false);
      setHistory(visits);
      setBefore(visits.length > 1 ? String(visits[visits.length - 1].id) : "");
      setAfter(visits.length ? String(visits[0].id) : "");
      setComparison(null);
      setDate(today());
      setNotes("");
      setMeasurements(initialMeasurements());
    });
  }
  async function savePatient(e) {
    e.preventDefault();
    await perform(async () => {
      const payload = {
        ...patientForm,
        birth_date: patientForm.birth_date || null,
      };
      const saved = await api(
        selected && editing ? `/patients/${selected.id}/` : "/patients/",
        {
          method: selected && editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setSelected(saved);
      setEditing(false);
      await loadPatients(appliedQuery, 1);
      await loadHistory(saved);
      setMessage("Expediente guardado.");
    });
  }
  async function saveConsultation(e) {
    e.preventDefault();
    await perform(async () => {
      await api("/consultations/", {
        method: "POST",
        body: JSON.stringify({
          patient: selected.id,
          date,
          notes,
          measurements: measurements.map((m) => ({
            ...m,
            value: m.value === "" ? null : m.value,
          })),
        }),
      });
      await loadHistory(selected);
      setNotes("");
      setMeasurements(initialMeasurements());
      setMessage("Consulta guardada y disponible en el historial.");
    });
  }
  function changeMeasurement(index, field, value) {
    setMeasurements((rows) =>
      rows.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }
  const notification = (
    <>
      {error && (
        <div role="alert" className="notice error">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="notice success">
          {message}
        </div>
      )}
    </>
  );
  if (checking) return <main className="loading">Cargando NutriGest…</main>;
  if (!user)
    return (
      <main className="login-shell">
        <div className="login-story">
          <div className="brand">◈ NutriGest</div>
          <span className="eyebrow">INFORMACIÓN PARA DAR SEGUIMIENTO</span>
          <h1>
            Cada consulta,
            <br />
            una historia
            <br />
            más clara.
          </h1>
          <p>Expedientes, mediciones y evolución en un mismo lugar.</p>
          <div className="demo-note">Proyecto académico · Datos ficticios</div>
        </div>
        <form className="login-card" onSubmit={login}>
          <span className="eyebrow">BIENVENIDA</span>
          <h2>Accede a tu consultorio</h2>
          <p>Ingresa con la cuenta preparada para tu equipo.</p>
          {notification}
          <Field label="Usuario">
            <input
              autoComplete="username"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              required
            />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
          </Field>
          <button disabled={busy} className="primary">
            {busy ? "Ingresando…" : "Iniciar sesión →"}
          </button>
        </form>
      </main>
    );
  return (
    <div className="app-shell">
      <aside>
        <div className="brand">◈ NutriGest</div>
        <p className="sidebar-caption">CONSULTORIO</p>
        <button
          className={section === "patients" ? "nav active" : "nav"}
          onClick={() => setSection("patients")}
        >
          ○ Expedientes
        </button>
        <button
          className={section === "sprints" ? "nav active" : "nav"}
          onClick={() => setSection("sprints")}
        >
          ▦ Equipo y sprints
        </button>
        <div className="sidebar-bottom">
          <span className="demo-note">Demostración académica</span>
          <small>Solo datos ficticios</small>
        </div>
      </aside>
      <main className="workspace">
        <header>
          <div>
            <span className="eyebrow">SEGUIMIENTO NUTRICIONAL</span>
            <h1>
              {section === "sprints" ? "Equipo y sprints" : "Expedientes"}
            </h1>
          </div>
          <div className="user">
            <span>{user.username}</span>
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                perform(async () => {
                  await api("/logout/", { method: "POST" });
                  setUser(null);
                  setSelected(null);
                  setPatients([]);
                  setHistory([]);
                  setError("");
                  setMessage("");
                })
              }
            >
              Salir
            </button>
          </div>
        </header>
        {notification}
        {section === "sprints" ? (
          <>
            <p className="subtle">
              Plan de tres días · 6–8 de octubre de 2026. Este tablero refleja
              el backlog del repositorio; actualiza sus estados con el
              orquestador.
            </p>
            <div className="sprint-grid">
              {[1, 2, 3].map((sprint) => (
                <section className="card" key={sprint}>
                  <span className="eyebrow">SPRINT {sprint}</span>
                  <h2>
                    {
                      [
                        "Base y pacientes",
                        "Consultas y evolución",
                        "Integración y entrega",
                      ][sprint - 1]
                    }
                  </h2>
                  {backlog.tasks
                    .filter((t) => t.sprint === sprint)
                    .map((t) => (
                      <article className="task" key={t.id}>
                        <span className="pill">
                          {t.id} · {t.status}
                        </span>
                        <h3>{t.title}</h3>
                        <p>
                          {t.owner} · Agente {t.agent}
                        </p>
                        <small>{t.acceptance}</small>
                        <small>
                          Dependencias: {t.dependencies.join(", ") || "ninguna"}
                        </small>
                      </article>
                    ))}
                </section>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="summary">
              <div>
                <span className="eyebrow">EXPEDIENTES EN ESTA BÚSQUEDA</span>
                <strong>{count}</strong>
              </div>
              <p>
                Consulta antecedentes y registra la evolución.
                <br />
                <span>
                  Las decisiones clínicas corresponden a la nutrióloga.
                </span>
              </p>
              <button
                className="primary"
                disabled={busy}
                onClick={() => {
                  setSelected(null);
                  setPatientForm({ ...blankPatient });
                  setEditing(true);
                  setHistory([]);
                  setComparison(null);
                  setError("");
                  setMessage("");
                }}
              >
                + Nuevo paciente
              </button>
            </div>
            <div className="patients-layout">
              <section className="card patient-list">
                <h2>Pacientes</h2>
                <form
                  className="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    perform(() => loadPatients(query, 1));
                  }}
                >
                  <input
                    aria-label="Buscar por nombre o teléfono"
                    placeholder="Buscar por nombre o teléfono"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button className="secondary" disabled={busy}>
                    Buscar
                  </button>
                </form>
                {patients.length === 0 ? (
                  <p className="empty">No hay expedientes en esta búsqueda.</p>
                ) : (
                  patients.map((p) => (
                    <button
                      key={p.id}
                      disabled={busy}
                      className={
                        "patient-item " +
                        (selected?.id === p.id ? "selected" : "")
                      }
                      onClick={() => openPatient(p)}
                    >
                      <span className="avatar">
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>
                        <b>{p.name}</b>
                        <small>
                          Expediente #{p.id} · {p.phone || "Sin teléfono"}
                        </small>
                      </span>
                      <span>→</span>
                    </button>
                  ))
                )}
                <div className="pagination">
                  <button
                    disabled={busy || page === 1}
                    onClick={() =>
                      perform(() => loadPatients(appliedQuery, page - 1))
                    }
                  >
                    Anterior
                  </button>
                  <small>Página {page}</small>
                  <button
                    disabled={busy || page * 50 >= count}
                    onClick={() =>
                      perform(() => loadPatients(appliedQuery, page + 1))
                    }
                  >
                    Siguiente
                  </button>
                </div>
              </section>
              <section className="details">
                {editing ? (
                  <form className="card" onSubmit={savePatient}>
                    <span className="eyebrow">EXPEDIENTE</span>
                    <h2>{selected ? "Editar paciente" : "Nuevo paciente"}</h2>
                    <div className="form-grid">
                      <Field label="Nombre *">
                        <input
                          maxLength={150}
                          value={patientForm.name}
                          onChange={(e) =>
                            setPatientForm({
                              ...patientForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </Field>
                      <Field label="Nacimiento">
                        <input
                          type="date"
                          max={today()}
                          value={patientForm.birth_date || ""}
                          onInput={(e) =>
                            setPatientForm({
                              ...patientForm,
                              birth_date: e.target.value,
                            })
                          }
                          onChange={(e) =>
                            setPatientForm({
                              ...patientForm,
                              birth_date: e.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="Teléfono">
                        <input
                          maxLength={25}
                          value={patientForm.phone}
                          onChange={(e) =>
                            setPatientForm({
                              ...patientForm,
                              phone: e.target.value,
                            })
                          }
                        />
                      </Field>
                      {[
                        ["allergies", "Alergias"],
                        ["preferences", "Preferencias"],
                        ["restrictions", "Restricciones"],
                      ].map(([key, label]) => (
                        <Field label={label} key={key}>
                          <textarea
                            value={patientForm[key]}
                            onChange={(e) =>
                              setPatientForm({
                                ...patientForm,
                                [key]: e.target.value,
                              })
                            }
                          />
                        </Field>
                      ))}
                    </div>
                    <div className="actions">
                      <button className="primary" disabled={busy}>
                        Guardar expediente
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setEditing(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : selected ? (
                  <>
                    <section className="card">
                      <div className="section-title">
                        <div>
                          <span className="eyebrow">
                            EXPEDIENTE #{selected.id}
                          </span>
                          <h2>{selected.name}</h2>
                        </div>
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => {
                            setPatientForm({ ...selected });
                            setEditing(true);
                          }}
                        >
                          Editar
                        </button>
                      </div>
                      <div className="food-grid">
                        {[
                          ["allergies", "Alergias"],
                          ["preferences", "Preferencias"],
                          ["restrictions", "Restricciones"],
                        ].map(([key, label]) => (
                          <div key={key}>
                            <small>{label}</small>
                            <p>{selected[key] || "Sin registro"}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                    <form className="card" onSubmit={saveConsultation}>
                      <span className="eyebrow">NUEVO REGISTRO</span>
                      <h2>Consulta de seguimiento</h2>
                      <Field label="Fecha *">
                        <input
                          type="date"
                          max={today()}
                          value={date}
                          onInput={(e) => setDate(e.target.value)}
                          onChange={(e) => setDate(e.target.value)}
                          required
                        />
                      </Field>
                      <p className="subtle">
                        Deja el valor vacío si no hay dato. Indica el método
                        para poder comparar.
                      </p>
                      <div className="measurement-grid">
                        {measurements.map((m, i) => (
                          <div className="measurement" key={m.kind}>
                            <h3>{labels[m.kind]}</h3>
                            <Field label={`${labels[m.kind]} · valor`}>
                              <input
                                type="number"
                                min="0"
                                max={m.unit === "%" ? "100" : "9999"}
                                step="0.01"
                                value={m.value}
                                onChange={(e) =>
                                  changeMeasurement(i, "value", e.target.value)
                                }
                              />
                            </Field>
                            <Field label={`${labels[m.kind]} · unidad`}>
                              <select
                                value={m.unit}
                                onChange={(e) =>
                                  changeMeasurement(i, "unit", e.target.value)
                                }
                              >
                                <option value="kg">kg</option>
                                {m.kind !== "weight" && (
                                  <option value="%">%</option>
                                )}
                              </select>
                            </Field>
                            <Field label={`${labels[m.kind]} · método`}>
                              <input
                                maxLength={100}
                                placeholder="Instrumento o técnica"
                                value={m.method}
                                onChange={(e) =>
                                  changeMeasurement(i, "method", e.target.value)
                                }
                              />
                            </Field>
                          </div>
                        ))}
                      </div>
                      <Field label="Notas preliminares">
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </Field>
                      <button className="primary" disabled={busy}>
                        Guardar consulta
                      </button>
                    </form>
                    <section className="card">
                      <span className="eyebrow">ANTECEDENTES</span>
                      <h2>
                        Historial de consultas{" "}
                        <span className="pill">{history.length}</span>
                      </h2>
                      {history.length === 0 ? (
                        <p className="empty">
                          Este paciente aún no tiene consultas.
                        </p>
                      ) : (
                        history.map((c) => (
                          <article className="visit" key={c.id}>
                            <h3>{formatDate(c.date)}</h3>
                            <div className="visit-values">
                              {c.measurements.map((m) => (
                                <span key={m.kind}>
                                  {labels[m.kind]}:{" "}
                                  <b>
                                    {m.value === null
                                      ? "Sin dato"
                                      : `${m.value} ${m.unit}`}
                                  </b>
                                </span>
                              ))}
                            </div>
                            <p className="preserve">{c.notes || "Sin notas"}</p>
                          </article>
                        ))
                      )}
                    </section>
                    <section className="card">
                      <span className="eyebrow">EVOLUCIÓN</span>
                      <h2>Comparar consultas</h2>
                      {history.length < 2 ? (
                        <p className="empty">
                          Registra al menos dos consultas para comparar.
                        </p>
                      ) : (
                        <>
                          <div className="form-grid">
                            <Field label="Consulta de referencia">
                              <select
                                value={before}
                                onChange={(e) => setBefore(e.target.value)}
                              >
                                {history.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {formatDate(c.date)} · #{c.id}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Consulta a comparar">
                              <select
                                value={after}
                                onChange={(e) => setAfter(e.target.value)}
                              >
                                {history.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {formatDate(c.date)} · #{c.id}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              perform(async () =>
                                setComparison(
                                  await api(
                                    `/patients/${selected.id}/compare/?before=${before}&after=${after}`,
                                  ),
                                ),
                              )
                            }
                          >
                            Calcular diferencias
                          </button>
                          {comparison && (
                            <div className="comparison">
                              {comparison.results.map((result) => (
                                <div key={result.kind}>
                                  <small>{result.label}</small>
                                  <strong>
                                    {result.delta !== null
                                      ? `${Number(result.delta) > 0 ? "+" : ""}${result.delta} ${result.unit === "%" ? "puntos porcentuales" : result.unit}`
                                      : "No comparable"}
                                  </strong>
                                  <p>
                                    {result.reason ||
                                      `${result.before} → ${result.after} ${result.unit}`}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  </>
                ) : (
                  <div className="card empty-detail">
                    <span className="empty-icon">◈</span>
                    <h2>Una historia, a la vez.</h2>
                    <p>
                      Selecciona un paciente para consultar su expediente
                      <br />o registra uno nuevo para comenzar.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
        <footer>
          NutriGest · Versión académica · Los campos y reglas provisionales
          están documentados para revisión.
        </footer>
      </main>
    </div>
  );
}
export default App;
