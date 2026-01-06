import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setupPassword } from "../api/authApi.js";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import Cargando from "../components/Cargando.jsx";

export default function SetupPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [repetirPassword, setRepetirPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const emailLimpio = useMemo(() => email.trim(), [email]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!emailLimpio) return setError("Ingresá el email.");
    if (!token.trim()) return setError("Ingresá el token.");
    if (!nuevaPassword || nuevaPassword.trim().length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (nuevaPassword !== repetirPassword) return setError("Las contraseñas no coinciden.");

    setCargando(true);
    try {
      await setupPassword({ email: emailLimpio, token: token.trim(), nuevaPassword: nuevaPassword.trim() });
      navigate("/login", { replace: true });
    } catch (e2) {
      setError(e2?.message || "No se pudo configurar la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <div style={caja}>
        <h2 style={{ margin: 0 }}>Configurar contraseña</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Pegá el token que te dio el admin y elegí una contraseña nueva.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <label style={label}>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={input} autoComplete="email" />
          </label>

          <label style={label}>
            Token
            <input value={token} onChange={(e) => setToken(e.target.value)} style={input} />
          </label>

          <label style={label}>
            Nueva contraseña
            <input
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              style={input}
              type="password"
              autoComplete="new-password"
            />
          </label>

          <label style={label}>
            Repetir contraseña
            <input
              value={repetirPassword}
              onChange={(e) => setRepetirPassword(e.target.value)}
              style={input}
              type="password"
              autoComplete="new-password"
            />
          </label>

          {error ? <ErrorMensaje mensaje={error} /> : null}
          {cargando ? <Cargando texto="Guardando..." /> : null}

          <button type="submit" style={botonPrimario} disabled={cargando}>
            Guardar contraseña
          </button>

          <Link to="/login" style={{ fontSize: 12, color: "#111827", fontWeight: 900 }}>
            Volver a ingresar
          </Link>
        </form>
      </div>
    </div>
  );
}

const caja = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 10,
};

const label = { display: "grid", gap: 6, fontSize: 12, fontWeight: 800, color: "#111827" };

const input = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
  fontSize: 14,
};

const botonPrimario = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};
