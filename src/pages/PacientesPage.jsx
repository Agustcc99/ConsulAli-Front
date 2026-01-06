import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPacientes, eliminarPacienteDefinitivo } from "../api/pacientesApi.js";
import Cargando from "../components/Cargando.jsx";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import ModalEliminarPaciente from "../components/ModalEliminarPaciente.jsx";

const TAM_PAGINA = 20;

function ordenarMasNuevosPrimero(lista) {
  const copia = Array.isArray(lista) ? [...lista] : [];

  return copia.sort((a, b) => {
    // 1) Si existe createdAt, usamos eso
    const aFecha = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bFecha = b?.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (aFecha && bFecha) return bFecha - aFecha;

    // 2) Fallback: ObjectId (en Mongo suele crecer con el tiempo)
    const aId = String(a?._id || a?.id || "");
    const bId = String(b?._id || b?.id || "");
    return bId.localeCompare(aId);
  });
}

export default function PacientesPage() {
  const navigate = useNavigate();

  const [consulta, setConsulta] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // ✅ paginación
  const [pagina, setPagina] = useState(1);

  // modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteAEliminar, setPacienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  const consultaLimpia = useMemo(() => consulta.trim(), [consulta]);

  // ✅ si cambia la búsqueda, volvemos a la página 1
  useEffect(() => {
    setPagina(1);
  }, [consultaLimpia]);

  useEffect(() => {
    let cancelado = false;

    async function cargarPacientes() {
      setCargando(true);
      setError("");

      try {
        const data = await obtenerPacientes({ q: consultaLimpia || undefined });

        if (!cancelado) {
          const lista = Array.isArray(data) ? data : [];
          setPacientes(ordenarMasNuevosPrimero(lista));
        }
      } catch (e) {
        if (!cancelado) setError(e?.message || "Error al cargar pacientes.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    const idTimeout = setTimeout(cargarPacientes, 300);
    return () => {
      cancelado = true;
      clearTimeout(idTimeout);
    };
  }, [consultaLimpia]);

  const totalPacientes = pacientes.length;
  const totalPaginas = Math.max(1, Math.ceil(totalPacientes / TAM_PAGINA));

  // ✅ si por alguna razón la página queda fuera de rango, la ajustamos
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
    if (pagina < 1) setPagina(1);
  }, [pagina, totalPaginas]);

  const inicio = (pagina - 1) * TAM_PAGINA;
  const fin = inicio + TAM_PAGINA;
  const pacientesPagina = useMemo(() => pacientes.slice(inicio, fin), [pacientes, inicio, fin]);

  const puedeAnterior = pagina > 1;
  const puedeSiguiente = pagina < totalPaginas;

  function abrirModalEliminar(paciente) {
    setPacienteAEliminar(paciente);
    setErrorEliminar("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (eliminando) return;
    setModalAbierto(false);
    setPacienteAEliminar(null);
    setErrorEliminar("");
  }

  async function confirmarEliminar() {
    const idPaciente = pacienteAEliminar?._id || pacienteAEliminar?.id;
    if (!idPaciente) return;

    setEliminando(true);
    setErrorEliminar("");

    try {
      await eliminarPacienteDefinitivo(idPaciente);

      setPacientes((prev) => prev.filter((p) => (p._id || p.id) !== idPaciente));
      cerrarModal();
    } catch (e) {
      setErrorEliminar(e?.message || "No se pudo eliminar el paciente.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {modalAbierto ? (
        <ModalEliminarPaciente
          nombrePaciente={pacienteAEliminar?.nombre || "Sin nombre"}
          cargando={eliminando}
          error={errorEliminar}
          onCancelar={cerrarModal}
          onConfirmar={confirmarEliminar}
        />
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Pacientes</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Buscar, crear y consultar pacientes.
          </p>
        </div>

        <button type="button" style={botonPrimario} onClick={() => navigate("/pacientes/nuevo")}>
          Nuevo paciente
        </button>
      </div>

      <div style={cajaBlanca}>
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar por nombre..."
          style={input}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Mostrando {totalPacientes === 0 ? 0 : inicio + 1}–{Math.min(fin, totalPacientes)} de {totalPacientes} ·
            Página {pagina} / {totalPaginas}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{ ...botonSecundario, opacity: puedeAnterior ? 1 : 0.5 }}
              disabled={!puedeAnterior}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              ◀ Anterior
            </button>

            <button
              type="button"
              style={{ ...botonSecundario, opacity: puedeSiguiente ? 1 : 0.5 }}
              disabled={!puedeSiguiente}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente ▶
            </button>
          </div>
        </div>

        {error ? <ErrorMensaje mensaje={error} /> : null}
        {cargando ? <Cargando texto="Cargando pacientes..." /> : null}

        <div style={{ display: "grid", gap: 8 }}>
          {!cargando && pacientesPagina.length === 0 ? (
            <div style={{ padding: 10, color: "#6b7280" }}>
              No hay pacientes para mostrar.
            </div>
          ) : null}

          {pacientesPagina.map((paciente) => {
            const idPaciente = paciente._id || paciente.id;

            return (
              <div key={idPaciente} style={fila}>
                <div style={{ display: "grid" }}>
                  <span style={{ fontWeight: 900 }}>{paciente.nombre || "Sin nombre"}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    ID: {idPaciente || "-"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={botonSecundario}
                    onClick={() => navigate(`/pacientes/${idPaciente}`)}
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    style={botonSecundario}
                    onClick={() => navigate(`/pacientes/${idPaciente}/editar`)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    style={botonPeligro}
                    onClick={() => abrirModalEliminar(paciente)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const cajaBlanca = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  display: "grid",
  gap: 10,
};

const input = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const fila = {
  padding: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fafafa",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
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
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const botonPeligro = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ef4444",
  background: "white",
  cursor: "pointer",
  fontWeight: 900,
  color: "#ef4444",
};
