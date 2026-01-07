const API_BASE = import.meta.env.VITE_API_BASE || "";

async function request({ metodo, ruta, datos, signal }) {
  const url = `${API_BASE}${ruta}`;

  const opciones = {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
  };

  if (datos !== undefined) {
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está levantado el backend?");
  }

  const esJson = (respuesta.headers.get("content-type") || "").includes("application/json");
  const cuerpo = esJson ? await respuesta.json().catch(() => null) : await respuesta.text().catch(() => "");

  if (!respuesta.ok) {
    const mensaje =
      (cuerpo && (cuerpo.message || cuerpo.mensaje || cuerpo.error)) ||
      `Error HTTP ${respuesta.status}`;
    throw new Error(mensaje);
  }

  return cuerpo;
}

export const apiGet = (ruta, opciones = {}) => request({ metodo: "GET", ruta, ...opciones });
export const apiPost = (ruta, datos, opciones = {}) => request({ metodo: "POST", ruta, datos, ...opciones });
export const apiPut = (ruta, datos, opciones = {}) => request({ metodo: "PUT", ruta, datos, ...opciones });
export const apiPatch = (ruta, datos, opciones = {}) => request({ metodo: "PATCH", ruta, datos, ...opciones });
export const apiDelete = (ruta, opciones = {}) => request({ metodo: "DELETE", ruta, ...opciones });
