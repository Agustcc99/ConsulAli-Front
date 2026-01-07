// Frontend/src/api/reportesApi.js
import { apiGet } from "./apiClient.js";

export async function obtenerReporteMensual({ anio, mes }) {
  return apiGet(`/api/reportes/mensual?anio=${encodeURIComponent(anio)}&mes=${encodeURIComponent(mes)}`);
}

export async function obtenerPendientes({ anio, mes }) {
  return apiGet(`/api/reportes/pendientes?anio=${encodeURIComponent(anio)}&mes=${encodeURIComponent(mes)}`);
}

/**
 * Reporte diario:
 * - si no mandás fecha => HOY (lo decide el backend)
 * - fecha en formato "YYYY-MM-DD"
 */
export async function obtenerReporteDiario({ fecha } = {}) {
  const qs = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
  return apiGet(`/api/reportes/diario${qs}`);
}
