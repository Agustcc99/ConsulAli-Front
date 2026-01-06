import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import { useAuth } from "../auth/useAuth.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await iniciarSesion(email, password);
      navigate("/pacientes", { replace: true });
    } catch (e2) {
      setError(e2?.message || "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0 }}>Iniciar sesión</h2>

      {error ? <ErrorMensaje mensaje={error} /> : null}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={input}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          style={input}
        />

        <button disabled={cargando} type="submit" style={btnPrimario}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/establecer-password")}
          style={btnSecundario}
        >
          Tengo un token (establecer / resetear contraseña)
        </button>
      </form>
    </div>
  );
}

const card = {
  maxWidth: 420,
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

const btnSecundario = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};
