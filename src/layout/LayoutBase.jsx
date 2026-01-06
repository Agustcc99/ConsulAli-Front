import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const estilosLink = ({ isActive }) => ({
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "white" : "#1f2937",
  background: isActive ? "#111827" : "transparent",
  fontWeight: 700,
});

export default function LayoutBase() {
  const authHabilitada = import.meta.env.VITE_AUTH_ENABLED === "1";
  const { usuario, cerrarSesion } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/LuGia.png"
              alt="LuGia"
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{ fontSize: 12, color: "#6b7280" }}>Pacientes y reportes</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Nav: si auth está ON, solo se muestra cuando hay sesión */}
            {(!authHabilitada || usuario) ? (
              <nav style={{ display: "flex", gap: 8 }}>
                <NavLink to="/pacientes" style={estilosLink}>
                  Pacientes
                </NavLink>
                <NavLink to="/reportes" style={estilosLink}>
                  Reportes
                </NavLink>

                {usuario?.rol === "admin" ? (
                  <NavLink to="/admin/usuarios" style={estilosLink}>
                    Admin
                  </NavLink>
                ) : null}
              </nav>
            ) : null}

            {authHabilitada ? (
              usuario ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", textAlign: "right" }}>
                    <div style={{ fontWeight: 900, color: "#111827" }}>{usuario.nombre}</div>
                    <div>Rol: {usuario.rol}</div>
                  </div>

                  <button type="button" style={botonSecundario} onClick={cerrarSesion}>
                    Salir
                  </button>
                </div>
              ) : (
                <NavLink to="/login" style={estilosLink}>
                  Ingresar
                </NavLink>
              )
            ) : null}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}

const botonSecundario = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#111827",
  fontWeight: 900,
  cursor: "pointer",
};
