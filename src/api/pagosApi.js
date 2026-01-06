import { apiPost, apiDelete } from "./apiClient.js";

export function crearPago(payload) {
  return apiPost("/api/pagos", payload);
}

export function eliminarPago(idPago) {
  return apiDelete(`/api/pagos/${idPago}`);
}
