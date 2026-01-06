const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function requestJson(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || `Error HTTP ${res.status}`;
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
