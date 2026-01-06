import { apiPost, apiDelete } from "./apiClient.js";

export function crearGasto(payload) {
  return apiPost("/api/gastos", payload);
}

export function eliminarGasto(idGasto) {
  return apiDelete(`/api/gastos/${idGasto}`);
}
