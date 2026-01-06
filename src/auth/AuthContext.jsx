import { createContext, useEffect, useMemo, useState } from "react";
import { authLogin, authLogout, authMe } from "../api/authApi.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [authHabilitada, setAuthHabilitada] = useState(true);

  async function refrescarSesion() {
    setCargando(true);
    try {
      const data = await authMe();
      setAuthHabilitada(Boolean(data?.authEnabled ?? true));
      setUsuario(data?.usuario ?? null);
    } catch {
      setAuthHabilitada(true);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    refrescarSesion();
  }, []);

  async function iniciarSesion(email, password) {
    const data = await authLogin(email, password);
    setAuthHabilitada(Boolean(data?.authEnabled ?? true));
    setUsuario(data?.usuario ?? null);
    return data;
  }

  async function cerrarSesion() {
    try {
      await authLogout();
    } finally {
      setUsuario(null);
    }
  }

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      authHabilitada,
      estaAutenticado: Boolean(usuario),   // <- CLAVE
      iniciarSesion,
      cerrarSesion,
      refrescarSesion,
    }),
    [usuario, cargando, authHabilitada]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
