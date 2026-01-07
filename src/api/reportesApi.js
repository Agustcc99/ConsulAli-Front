// Frontend/src/api/reportesApi.js
// IMPORTANTE:
// - En producción (Vercel), queremos pegarle a "/api/..." para que funcione el proxy/rewrite.
// - En desarrollo (Vite), también podés usar "/api/..." si tenés proxy o si el back corre mismo host.
// - Esto evita hardcodear localhost y evita problemas de cookies/SameSite en iOS.

async function requestJson(path) {
  const res = await fetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const esJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = esJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || data?.mensaje || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export async function obtenerReporteMensual({ anio, mes }) {
  return requestJson(`/api/reportes/mensual?anio=${anio}&mes=${mes}`);
}

export async function obtenerPendientes({ anio, mes }) {
  return requestJson(`/api/reportes/pendientes?anio=${anio}&mes=${mes}`);
}

/**
 * Reporte diario:
 * - si no mandás fecha => HOY
 * - fecha en formato "YYYY-MM-DD"
 */
export async function obtenerReporteDiario({ fecha } = {}) {
  const qs = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
  return requestJson(`/api/reportes/diario${qs}`);
}
