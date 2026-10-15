let csrf = "";
export async function api(path, options = {}) {
  const method = options.method || "GET";
  if (method !== "GET" && !csrf) {
    const res = await fetch("/api/csrf/", { credentials: "same-origin" });
    if (!res.ok) throw new Error("No se pudo iniciar la sesión segura.");
    csrf = (await res.json()).csrfToken;
  }
  const response = await fetch("/api" + path, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(method !== "GET" ? { "X-CSRFToken": csrf } : {}),
      ...options.headers,
    },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("El servidor no respondió correctamente.");
  }
  if (!response.ok) {
    if (response.status === 403)
      throw new Error(
        "Sesión no disponible o solicitud rechazada. Vuelve a iniciar sesión.",
      );
    throw new Error(
      data.detail ||
        Object.entries(data)
          .map(([field, value]) => `${field}: ${JSON.stringify(value)}`)
          .join(" · "),
    );
  }
  if (data.csrfToken) csrf = data.csrfToken;
  return data;
}
