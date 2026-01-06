import { useCallback, useEffect, useState } from "react";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import { useAuth } from "../auth/useAuth.js";
import {
  adminCrearUsuario,
  adminGenerarResetToken,
  adminListarUsuarios,
} from "../api/authApi.js";

export default function AdminUsuariosPage() {
  const { usuario } = useAuth();

  const [q, setQ] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [crearEmail, setCrearEmail] = useState("");
  const [crearNombre, setCrearNombre] = useState("");
  const [crearRol, setCrearRol] = useState("user");

  const [asignarPasswordInicial, setAsignarPasswordInicial] = useState(true);
  const [passwordInicial, setPasswordInicial] = useState("");
  const [passwordInicial2, setPasswordInicial2] = useState("");

  const [resetEmail, setResetEmail] = useState("");

  const [tokenInfo, setTokenInfo] = useState(null);
  // tokenInfo: { tipo, email, token, expira }

  const [mensajeOk, setMensajeOk] = useState("");

  const esAdmin = usuario?.rol === "admin";
  if (!esAdmin) {
    return (
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Admin</h2>
        <ErrorMensaje mensaje="No tenés permisos para ver esta sección." />
      </div>
    );
  }

  const cargarUsuarios = useCallback(async (busqueda = "") => {
    setError("");
    setCargando(true);
    try {
      const data = await adminListarUsuarios(busqueda, 20);
      setUsuarios(data?.usuarios || []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar la lista de usuarios.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios("");
  }, [cargarUsuarios]);

  async function onCrear(e) {
    e.preventDefault();
    setError("");
    setTokenInfo(null);
    setMensajeOk("");

    const emailLimpio = String(crearEmail || "").trim().toLowerCase();
    const nombreLimpio = String(crearNombre || "").trim();

    if (!emailLimpio) {
      setError("El email es obligatorio.");
      return;
    }

    if (asignarPasswordInicial) {
      if (passwordInicial.length < 8) {
        setError("La contraseña inicial debe tener al menos 8 caracteres.");
        return;
      }
      if (passwordInicial !== passwordInicial2) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    try {
      const payload = {
        email: emailLimpio,
        nombre: nombreLimpio,
        rol: crearRol,
        ...(asignarPasswordInicial ? { passwordInicial } : {}),
      };

      const data = await adminCrearUsuario(payload);

      if (data?.tokenCrearPassword) {
        setTokenInfo({
          tipo: "alta",
          email: data?.usuario?.email || emailLimpio,
          token: data?.tokenCrearPassword,
          expira: data?.expira,
        });
      } else {
        setMensajeOk(
          "Usuario creado con contraseña inicial. Ya puede iniciar sesión con su email y la contraseña que definiste."
        );
      }

      setCrearEmail("");
      setCrearNombre("");
      setCrearRol("user");
      setPasswordInicial("");
      setPasswordInicial2("");

      await cargarUsuarios(q);
    } catch (e2) {
      setError(e2?.message || "No se pudo crear el usuario.");
    }
  }

  async function onReset(e) {
    e.preventDefault();
    setError("");
    setTokenInfo(null);
    setMensajeOk("");

    const emailLimpio = String(resetEmail || "").trim().toLowerCase();
    if (!emailLimpio) {
      setError("El email es obligatorio.");
      return;
    }

    try {
      const data = await adminGenerarResetToken(emailLimpio);
      setTokenInfo({
        tipo: "reset",
        email: data?.usuario?.email || emailLimpio,
        token: data?.tokenResetPassword,
        expira: data?.expira,
      });
      await cargarUsuarios(q);
    } catch (e2) {
      setError(e2?.message || "No se pudo generar el token.");
    }
  }

  async function copiarToken() {
    if (!tokenInfo?.token) return;
    try {
      await navigator.clipboard.writeText(tokenInfo.token);
    } catch {
      // sin permisos de clipboard, no hacemos nada
    }
  }

  function abrirEstablecerPassword() {
    window.open("/establecer-password", "_blank");
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Admin - Usuarios</h2>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Creá usuarios, asigná contraseña inicial o generá tokens para alta/reset.
        </p>

        {error ? <ErrorMensaje mensaje={error} /> : null}
        {mensajeOk ? <div style={okBox}>{mensajeOk}</div> : null}

        {tokenInfo ? (
          <div style={tokenBox}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>
              Token ({tokenInfo.tipo}) para: {tokenInfo.email}
            </div>
            <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
              {tokenInfo.token}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
              Expira: {tokenInfo.expira}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={btnSecundario} onClick={copiarToken}>
                Copiar token
              </button>

              <button type="button" style={btnSecundario} onClick={abrirEstablecerPassword}>
                Abrir pantalla "Establecer contraseña"
              </button>

              <div style={{ fontSize: 12, color: "#6b7280", alignSelf: "center" }}>
                El usuario entra a Login y toca "Tengo un token..."
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Crear usuario</h3>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={asignarPasswordInicial}
              onChange={(e) => setAsignarPasswordInicial(e.target.checked)}
            />
            <span style={{ fontWeight: 800 }}>
              Asignar contraseña inicial (recomendado)
            </span>
          </label>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            Si está desactivado, se crea sin contraseña y se genera un token para que el usuario la defina.
          </div>
        </div>

        <form onSubmit={onCrear} style={{ display: "grid", gap: 10 }}>
          <input
            value={crearEmail}
            onChange={(e) => setCrearEmail(e.target.value)}
            placeholder="Email"
            style={input}
          />
          <input
            value={crearNombre}
            onChange={(e) => setCrearNombre(e.target.value)}
            placeholder="Nombre"
            style={input}
          />
          <select value={crearRol} onChange={(e) => setCrearRol(e.target.value)} style={input}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>

          {asignarPasswordInicial ? (
            <>
              <input
                value={passwordInicial}
                onChange={(e) => setPasswordInicial(e.target.value)}
                placeholder="Contraseña inicial (mínimo 8)"
                type="password"
                style={input}
              />
              <input
                value={passwordInicial2}
                onChange={(e) => setPasswordInicial2(e.target.value)}
                placeholder="Repetir contraseña inicial"
                type="password"
                style={input}
              />
            </>
          ) : null}

          <button type="submit" style={btnPrimario}>
            {asignarPasswordInicial ? "Crear usuario" : "Crear y generar token"}
          </button>
        </form>
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Resetear contraseña (token)</h3>
        <form onSubmit={onReset} style={{ display: "grid", gap: 10 }}>
          <input
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Email del usuario"
            style={input}
          />
          <button type="submit" style={btnPrimario}>
            Generar token de reset
          </button>
        </form>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Usuarios (lista chica)</h3>
          <button
            type="button"
            style={btnSecundario}
            onClick={() => cargarUsuarios(q)}
            disabled={cargando}
          >
            {cargando ? "Cargando..." : "Refrescar"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por email o nombre"
            style={input}
          />
          <button type="button" style={btnSecundario} onClick={() => cargarUsuarios(q)}>
            Buscar
          </button>
        </div>

        <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb" }}>
          {usuarios.length === 0 ? (
            <div style={{ padding: "12px 0", color: "#6b7280" }}>Sin resultados</div>
          ) : (
            usuarios.map((u) => (
              <div key={u.id} style={fila}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, color: "#111827" }}>{u.email}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {u.nombre || "-"} | rol: {u.rol} | activo: {String(u.activo)} | debeCambiarPassword:{" "}
                    {String(u.debeCambiarPassword)}
                  </div>
                </div>

                <button
                  type="button"
                  style={btnSecundario}
                  onClick={() => {
                    setError("");
                    setTokenInfo(null);
                    setMensajeOk("");
                    adminGenerarResetToken(u.email)
                      .then((data) => {
                        setTokenInfo({
                          tipo: "reset",
                          email: data?.usuario?.email || u.email,
                          token: data?.tokenResetPassword,
                          expira: data?.expira,
                        });
                      })
                      .catch((e2) => setError(e2?.message || "No se pudo generar el token."));
                  }}
                >
                  Generar token
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const card = {
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
  width: "100%",
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

const tokenBox = {
  marginTop: 12,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
};

const okBox = {
  marginTop: 12,
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  borderRadius: 12,
  padding: 12,
  fontWeight: 800,
};

const fila = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #e5e7eb",
};
