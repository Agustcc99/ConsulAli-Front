import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { actualizarPaciente, crearPaciente, obtenerPacientes } from "../api/pacientesApi.js";
import Cargando from "../components/Cargando.jsx";
import ErrorMensaje from "../components/ErrorMensaje.jsx";

export default function PacienteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const esEdicion = useMemo(() => Boolean(id), [id]);

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    observaciones: "",
  });

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargarSiEsEdicion() {
      // ✅ CLAVE: en /pacientes/nuevo NO hay id
      if (!id) return;

      setCargando(true);
      setError("");

      try {
        // No dependemos de GET /api/pacientes/:id (que capaz no existe).
        // Traemos lista y buscamos por id.
        const lista = await obtenerPacientes();
        const encontrado = Array.isArray(lista)
          ? lista.find((p) => String(p._id || p.id) === String(id))
          : null;

        if (!encontrado) throw new Error("Paciente no encontrado.");

        if (!cancelado) {
          setForm({
            nombre: encontrado.nombre || "",
            telefono: encontrado.telefono || "",
            observaciones: encontrado.observaciones || "",
          });
        }
      } catch (e) {
        if (!cancelado) setError(e?.message || "No se pudo cargar el paciente.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarSiEsEdicion();

    return () => {
      cancelado = true;
    };
  }, [id]);

  function onChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    const nombreLimpio = form.nombre.trim();
    if (!nombreLimpio) {
      setError("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const payload = {
        nombre: nombreLimpio,
        telefono: form.telefono.trim(),
        observaciones: form.observaciones.trim(),
      };

      if (esEdicion) {
        await actualizarPaciente(id, payload);
      } else {
        await crearPaciente(payload);
      }

      navigate("/pacientes");
    } catch (e2) {
      setError(e2?.message || "No se pudo guardar el paciente.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{esEdicion ? "Editar paciente" : "Nuevo paciente"}</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Agregá datos para evitar confusiones.
          </p>
        </div>
      </div>

      {error ? <ErrorMensaje mensaje={error} /> : null}
      {cargando ? <Cargando texto="Cargando paciente..." /> : null}

      {!cargando ? (
        <form onSubmit={onSubmit} style={cajaBlanca}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={label}>Nombre *</label>
            <input
              value={form.nombre}
              onChange={(e) => onChange("nombre", e.target.value)}
              placeholder="Ej: Juan Pérez"
              style={input}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={label}>Teléfono (opcional)</label>
              <input
                value={form.telefono}
                onChange={(e) => onChange("telefono", e.target.value)}
                placeholder="Ej: 351xxxxxxx"
                style={input}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={label}> </label>
              <div style={{ color: "#6b7280", fontSize: 12, paddingTop: 10 }}>
                {/* espacio para mantener alineado */}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={label}>Observaciones (opcional)</label>
            <textarea
              value={form.observaciones}
              onChange={(e) => onChange("observaciones", e.target.value)}
              placeholder="Ej: 'Viene por recomendación...' / 'Diferenciar del hijo' / etc."
              style={{ ...input, minHeight: 90, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/pacientes" style={{ textDecoration: "none" }}>
              <button type="button" style={botonSecundario} disabled={guardando}>
                Cancelar
              </button>
            </Link>

            <button type="submit" style={botonPrimario} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

const cajaBlanca = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  display: "grid",
  gap: 12,
};

const label = {
  fontWeight: 800,
};

const input = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const botonPrimario = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const botonSecundario = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};
