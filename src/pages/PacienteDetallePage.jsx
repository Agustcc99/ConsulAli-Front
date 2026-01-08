import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { obtenerPacientes, obtenerResumenPaciente } from "../api/pacientesApi.js";
import { eliminarTratamientoDefinitivo } from "../api/tratamientosApi.js";
import Cargando from "../components/Cargando.jsx";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import { formatearMonedaARS } from "../utils/moneda.js";

function fechaCorta(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR");
}

function textoSeguro(valor) {
  const t = valor == null ? "" : String(valor);
  return t.trim() ? t : "";
}

function FilaDato({ etiqueta, valor }) {
  const v = textoSeguro(valor);
  if (!v) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 10,
        padding: "8px 0",
        borderTop: "1px solid #eef2f7",
      }}
    >
      <div style={{ color: "#6b7280", fontWeight: 800 }}>{etiqueta}</div>
      <div style={{ color: "#111827", whiteSpace: "pre-wrap" }}>{v}</div>
    </div>
  );
}

export default function PacienteDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [paciente, setPaciente] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [borrandoId, setBorrandoId] = useState("");

  async function recargarResumen() {
    const rResumen = await obtenerResumenPaciente(id);
    setResumen(rResumen);
  }

  useEffect(() => {
    let cancelado = false;

    async function cargarTodo() {
      setCargando(true);
      setError("");
      setPaciente(null);

      const [rResumen, rPacientes] = await Promise.allSettled([
        obtenerResumenPaciente(id),
        obtenerPacientes(),
      ]);

      if (cancelado) return;

      if (rResumen.status === "fulfilled") {
        setResumen(rResumen.value);
      } else {
        setError(rResumen.reason?.message || "No se pudo cargar el resumen del paciente.");
        setResumen(null);
      }

      if (rPacientes.status === "fulfilled") {
        const lista = rPacientes.value;
        const encontrado = Array.isArray(lista)
          ? lista.find((p) => String(p?._id || p?.id) === String(id))
          : null;
        setPaciente(encontrado || null);
      } else {
        setPaciente(null);
      }

      setCargando(false);
    }

    cargarTodo();
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function handleEliminarTratamiento(idTrat) {
    if (!idTrat) return;

    const ok = window.confirm(
      "Eliminar tratamiento definitivamente?\nSe borran también sus pagos y gastos.\nEsta acción no se puede deshacer."
    );
    if (!ok) return;

    setError("");
    setBorrandoId(String(idTrat));

    try {
      await eliminarTratamientoDefinitivo(idTrat);
      await recargarResumen();
    } catch (e) {
      setError(e?.message || "No se pudo eliminar el tratamiento.");
    } finally {
      setBorrandoId("");
    }
  }

  const totales = resumen?.totales || {};
  const saldoPaciente = totales?.saldoPaciente ?? 0;
  const saldoMama = totales?.saldoMama ?? 0;
  const saldoAlicia = totales?.saldoAlicia ?? 0;
  const saldoLab = totales?.saldoLaboratorio ?? 0;

  const items = Array.isArray(resumen?.tratamientos) ? resumen.tratamientos : [];

  const telefono = textoSeguro(paciente?.telefono);
  const observaciones = textoSeguro(paciente?.observaciones);
  const mostrarDatosPaciente = Boolean(telefono || observaciones);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Paciente</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>Resumen y tratamientos del paciente.</p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={estiloBotonSecundario} onClick={() => navigate(-1)}>
            Volver
          </button>

          <Link to={`/pacientes/${id}/tratamientos/nuevo`} style={{ textDecoration: "none" }}>
            <button type="button" style={estiloBotonPrimario}>
              Nuevo tratamiento
            </button>
          </Link>
        </div>
      </div>

      {error ? <ErrorMensaje mensaje={error} /> : null}
      {cargando ? <Cargando texto="Cargando..." /> : null}

      {!cargando && resumen ? (
        <>
          {mostrarDatosPaciente ? (
            <div style={cajaBlanca}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Datos del paciente</h3>
              <FilaDato etiqueta="Teléfono" valor={telefono} />
              <FilaDato etiqueta="Observaciones" valor={observaciones} />
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            <Tarjeta titulo="Saldo paciente" valor={formatearMonedaARS(saldoPaciente)} />
            <Tarjeta titulo="Saldo mamá" valor={formatearMonedaARS(saldoMama)} />
            <Tarjeta titulo="Saldo Alicia" valor={formatearMonedaARS(saldoAlicia)} />
            <Tarjeta titulo="Laboratorio" valor={formatearMonedaARS(saldoLab)} />
          </div>

          <div style={cajaBlanca}>
            <h3 style={{ marginTop: 0 }}>Tratamientos</h3>

            {items.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {items.map((item) => {
                  const t = item?.tratamiento || {};
                  const r = item?.resumenFinanciero || {};
                  const idTrat = t?._id || t?.id;

                  return (
                    <div key={idTrat} style={fila}>
                      <div style={{ display: "grid", gap: 2 }}>
                        <strong>{t.descripcion || "Tratamiento"}</strong>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {fechaCorta(t.fechaInicio)} · Estado: {t.estado}
                        </span>

                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          Precio: {formatearMonedaARS(t.precioPaciente ?? 0)} · Pagado:{" "}
                          {formatearMonedaARS(r.totalPagado ?? 0)} · Lab real:{" "}
                          {formatearMonedaARS(r.labReal ?? 0)}
                        </span>

                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          Saldo paciente: {formatearMonedaARS(r?.saldo?.paciente ?? 0)} · Saldo mamá:{" "}
                          {formatearMonedaARS(r?.saldo?.mama ?? 0)} · Saldo Alicia:{" "}
                          {formatearMonedaARS(r?.saldo?.alicia ?? 0)}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Link to={`/tratamientos/${idTrat}`} style={{ textDecoration: "none" }}>
                          <button type="button" style={estiloBotonSecundario}>
                            Ver
                          </button>
                        </Link>

                        <button
                          type="button"
                          style={estiloBotonPeligro}
                          onClick={() => handleEliminarTratamiento(idTrat)}
                          disabled={borrandoId === String(idTrat)}
                          title="Elimina también pagos y gastos del tratamiento"
                        >
                          {borrandoId === String(idTrat) ? "Borrando..." : "Borrar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#6b7280" }}>Este paciente todavía no tiene tratamientos.</div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Tarjeta({ titulo, valor }) {
  return (
    <div style={cajaBlanca}>
      <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 700 }}>{titulo}</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{valor}</div>
    </div>
  );
}

const cajaBlanca = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
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

const estiloBotonPrimario = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111827",
  background: "#111827",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const estiloBotonSecundario = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};

const estiloBotonPeligro = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ef4444",
  background: "white",
  color: "#ef4444",
  fontWeight: 900,
  cursor: "pointer",
};
