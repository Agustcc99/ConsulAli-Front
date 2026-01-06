import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient.js";

export function obtenerPacientes({ q } = {}) {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiGet(`/api/pacientes${query}`);
}

export function crearPaciente(datosPaciente) {
  return apiPost("/api/pacientes", datosPaciente);
}

export function actualizarPaciente(idPaciente, datosPaciente) {
  return apiPut(`/api/pacientes/${idPaciente}`, datosPaciente);
}

export function obtenerResumenPaciente(idPaciente) {
  return apiGet(`/api/pacientes/${idPaciente}/resumen`);
}

// ELIMINACIÓN DEFINITIVA (borra paciente + tratamientos + pagos + gastos)
export function eliminarPacienteDefinitivo(idPaciente) {
  return apiDelete(`/api/pacientes/${idPaciente}?modo=eliminar`);
}
