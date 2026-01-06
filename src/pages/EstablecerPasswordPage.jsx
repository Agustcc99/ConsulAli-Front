import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import { establecerPassword } from "../api/authApi.js";

export default function EstablecerPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const tokenInicial = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token") || "";
  }, [location.search]);

  const [token, setToken] = useState(tokenInicial);
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");

    if (!token.trim()) return setError("El token es obligatorio.");
    if (nuevoPassword.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (nuevoPassword !== repetir) return setError("Las contraseñas no coinciden.");

    setCargando(true);
    try {
      await establecerPassword(token.trim(), nuevoPassword);
      setOk("Contraseña establecida. Ya podés iniciar sesión.");
      setTimeout(() => navigate("/login", { replace: true }), 400);
    } catch (e2) {
      setError(e2?.message || "No se pudo establecer la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0 }}>Establecer contraseña</h2>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        Pegá el token que te dio el administrador y elegí una contraseña.
      </p>

      {error ? <ErrorMensaje mensaje={error} /> : null}
      {ok ? <div style={okBox}>{ok}</div> : null}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token"
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
          placeholder="Repetir contraseña"
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
  margin: "40px auto",
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
};
