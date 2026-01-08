import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./apiClient.js";

export async function obtenerTratamientos({ pacienteId, estado } = {}) {
  const params = new URLSearchParams();
  if (pacienteId) params.append("pacienteId", pacienteId);
  if (estado) params.append("estado", estado);
  const q = params.toString() ? `?${params.toString()}` : "";
  return apiGet(`/api/tratamientos${q}`);
}

export function crearTratamiento(payload) {
  return apiPost("/api/tratamientos", payload);
}

export function actualizarTratamiento(id, payload) {
  return apiPut(`/api/tratamientos/${id}`, payload);
}

export function actualizarEstadoTratamiento(id, estado) {
  return apiPatch(`/api/tratamientos/${id}/estado`, { estado }); // activo|finalizado|cancelado
}

export function obtenerResumenFinancieroTratamiento(id) {
  return apiGet(`/api/tratamientos/${id}/resumen-financiero`);
}

/**
 * HARD DELETE (cascada): borra tratamiento + pagos + gastos (IRREVERSIBLE)
 * Back: DELETE /api/tratamientos/:id?modo=eliminar
 */
export function eliminarTratamientoDefinitivo(id) {
  return apiDelete(`/api/tratamientos/${id}?modo=eliminar`);
}

/**
 * Soft delete: cancelar tratamiento (reversible si querés)
 * Back: DELETE /api/tratamientos/:id?modo=cancelar  (default)
 */
export function cancelarTratamiento(id) {
  return apiDelete(`/api/tratamientos/${id}?modo=cancelar`);
}
