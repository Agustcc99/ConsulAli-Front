import { apiGet, apiPost } from "./apiClient.js";

export const authMe = () => apiGet("/api/auth/me");
export const authLogin = (email, password) => apiPost("/api/auth/login", { email, password });
export const authLogout = () => apiPost("/api/auth/logout");

export const adminCrearUsuario = (datos) => apiPost("/api/auth/usuarios", datos);
export const adminListarUsuarios = (q = "", limit = 20) =>
  apiGet(`/api/auth/usuarios?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`);

export const adminGenerarResetToken = (email) =>
  apiPost("/api/auth/usuarios/reset-token", { email });

export const establecerPassword = (token, nuevoPassword) =>
  apiPost("/api/auth/establecer-password", { token, nuevoPassword });

export const cambiarPassword = (passwordActual, nuevoPassword) =>
  apiPost("/api/auth/cambiar-password", { passwordActual, nuevoPassword });
