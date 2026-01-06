import { useState } from "react";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import { useAuth } from "../auth/useAuth.js";
import { cambiarPassword } from "../api/authApi.js";

export default function CuentaPage() {
  const { usuario } = useAuth();

  const [passwordActual, setPasswordActual] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");

    if (!passwordActual) return setError("La contraseña actual es obligatoria.");
    if (nuevoPassword.length < 8) return setError("La nueva contraseña debe tener al menos 8 caracteres.");
    if (nuevoPassword !== repetir) return setError("Las contraseñas no coinciden.");

    setCargando(true);
    try {
      await cambiarPassword(passwordActual, nuevoPassword);
      setOk("Contraseña cambiada correctamente.");
      setPasswordActual("");
      setNuevoPassword("");
      setRepetir("");
    } catch (e2) {
      setError(e2?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0 }}>Mi cuenta</h2>

      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
        <div><b>Email:</b> {usuario?.email}</div>
        <div><b>Nombre:</b> {usuario?.nombre}</div>
        <div><b>Rol:</b> {usuario?.rol}</div>
      </div>

      {error ? <ErrorMensaje mensaje={error} /> : null}
      {ok ? <div style={okBox}>{ok}</div> : null}

      <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
          placeholder="Contraseña actual"
          type="password"
          style={input}
        />
        <input
          value={nuevoPassword}
          onChange={(e) => setNuevoPassword(e.target.value)}
          placeholder="Nueva contraseña (mínimo 8)"
          type="password"
          style={input}
        />
        <input
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          placeholder="Repetir nueva contraseña"
          type="password"
          style={input}
        />

        <button disabled={cargando} type="submit" style={btnPrimario}>
          {cargando ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}

const card = {
  maxWidth: 520,
  margin: "20px auto",
  background: "white",
  padding: 16,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
};

const input = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const btnPrimario = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const okBox = {
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  padding: 10,
  borderRadius: 12,
  marginBottom: 10,
  fontWeight: 800,
};
