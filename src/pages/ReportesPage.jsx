import { useEffect, useMemo, useState } from "react";
import Cargando from "../components/Cargando.jsx";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import SelectorMesAnio from "../components/SelectorMesAnio.jsx";
import { formatearMonedaARS } from "../utils/moneda.js";
import {
  obtenerPendientes,
  obtenerReporteMensual,
  obtenerReporteDiario,
} from "../api/reportesApi.js";
import { Link } from "react-router-dom";

/** Lee un número de una ruta anidada (ej: ["cashflowDelMes","totalCobradoPacientesMes"]) */
function leerNumeroRuta(obj, ruta, defecto = 0) {
  let actual = obj;
  for (const clave of ruta) {
    if (actual == null) return defecto;
    actual = actual[clave];
  }
  return typeof actual === "number" && Number.isFinite(actual) ? actual : defecto;
}

function leerObjetoRuta(obj, ruta, defecto = {}) {
  let actual = obj;
  for (const clave of ruta) {
    if (actual == null) return defecto;
    actual = actual[clave];
  }
  return actual && typeof actual === "object" ? actual : defecto;
}

function leerListaRuta(obj, ruta, defecto = []) {
  let actual = obj;
  for (const clave of ruta) {
    if (actual == null) return defecto;
    actual = actual[clave];
  }
  return Array.isArray(actual) ? actual : defecto;
}

function obtenerTextoPaciente(item) {
  return (
    item?.paciente?.nombre ||
    item?.pacienteNombre ||
    item?.nombrePaciente ||
    item?.nombre ||
    "Paciente"
  );
}

function obtenerTextoTratamiento(item) {
  return (
    item?.tratamiento?.descripcion ||
    item?.descripcion ||
    item?.tipo ||
    "Tratamiento"
  );
}

/**
 * Intenta encontrar el pendiente en muchos formatos posibles.
 * (porque cada backend suele armarlo distinto)
 */
function obtenerPendiente(item, paraQuien) {
  const clavesDirectas =
    paraQuien === "mama"
      ? ["saldo", "pendiente", "montoPendiente", "saldoMama", "pendienteMama"]
      : ["saldo", "pendiente", "montoPendiente", "saldoAlicia", "pendienteAlicia"];

  for (const k of clavesDirectas) {
    const v = item?.[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }

  // Opciones anidadas
  const v1 = item?.resumenFinanciero?.saldo?.[paraQuien];
  if (typeof v1 === "number" && Number.isFinite(v1)) return v1;

  const v2 = item?.resumen?.saldo?.[paraQuien];
  if (typeof v2 === "number" && Number.isFinite(v2)) return v2;

  const v3 = item?.saldo?.[paraQuien];
  if (typeof v3 === "number" && Number.isFinite(v3)) return v3;

  return 0;
}

function fechaISOParaInput(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fechaCorta(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR");
}

export default function ReportesPage() {
  const hoy = useMemo(() => new Date(), []);
  const [filtro, setFiltro] = useState({
    anio: hoy.getFullYear(),
    mes: hoy.getMonth() + 1,
  });

  const [tab, setTab] = useState("mensual"); // "mensual" | "pendientes" | "diario"
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [reporteMensual, setReporteMensual] = useState(null);
  const [pendientes, setPendientes] = useState(null);
  const [reporteDiario, setReporteDiario] = useState(null);

  const [verRaw, setVerRaw] = useState(false);

  const [fechaDiaria, setFechaDiaria] = useState(fechaISOParaInput(hoy));

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        if (tab === "mensual") {
          const data = await obtenerReporteMensual(filtro);
          if (!cancelado) setReporteMensual(data);
        } else if (tab === "pendientes") {
          const data = await obtenerPendientes(filtro);
          if (!cancelado) setPendientes(data);
        } else {
          const data = await obtenerReporteDiario({ fecha: fechaDiaria });
          if (!cancelado) setReporteDiario(data);
        }
      } catch (e) {
        if (!cancelado) setError(e?.message || "No se pudo cargar el reporte.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [filtro.anio, filtro.mes, tab, fechaDiaria]);

  // =========================
  //  MENSUAL (según tu JSON real)
  // =========================
  const mensual = reporteMensual || {};

  const totalCobradoPacientesMes = leerNumeroRuta(
    mensual,
    ["cashflowDelMes", "totalCobradoPacientesMes"],
    0
  );
  const totalPagadoLaboratorioMes = leerNumeroRuta(
    mensual,
    ["cashflowDelMes", "totalPagadoLaboratorioMes"],
    0
  );

  const totalGastosMes = leerNumeroRuta(mensual, ["cashflowDelMes", "totalGastosMes"], 0);
  const cantidadPagosMes = leerNumeroRuta(mensual, ["cashflowDelMes", "cantidadPagosMes"], 0);
  const cantidadGastosMes = leerNumeroRuta(mensual, ["cashflowDelMes", "cantidadGastosMes"], 0);

  const totalCorrespondienteMama = leerNumeroRuta(
    mensual,
    ["fotoCierreMes", "totalCorrespondienteMama"],
    0
  );
  const totalCobradoMama = leerNumeroRuta(mensual, ["fotoCierreMes", "totalCobradoMama"], 0);
  const totalPendienteMama = leerNumeroRuta(mensual, ["fotoCierreMes", "totalPendienteMama"], 0);

  const totalCorrespondienteAlicia = leerNumeroRuta(
    mensual,
    ["fotoCierreMes", "totalCorrespondienteAlicia"],
    0
  );
  const totalCobradoAlicia = leerNumeroRuta(mensual, ["fotoCierreMes", "totalCobradoAlicia"], 0);
  const totalPendienteAlicia = leerNumeroRuta(
    mensual,
    ["fotoCierreMes", "totalPendienteAlicia"],
    0
  );

  const saldoPendienteTotalPacientes = leerNumeroRuta(
    mensual,
    ["fotoCierreMes", "saldoPendienteTotalPacientes"],
    0
  );

  // =========================
  //  PENDIENTES (según tu JSON real)
  // =========================
  const pend = pendientes || {};
  const pendientesMama = leerListaRuta(pend, ["pendientesMama"], []);
  const pendientesAlicia = leerListaRuta(pend, ["pendientesAlicia"], []);

  // =========================
  //  DIARIO (según tu JSON nuevo)
  // =========================
  const diario = reporteDiario || {};

  const totalCobradoPacientesDia = leerNumeroRuta(diario, ["cashflowDelDia", "totalCobradoPacientesDia"], 0);
  const porMetodo = leerObjetoRuta(diario, ["cashflowDelDia", "porMetodo"], {});
  const cobradoEfectivo = typeof porMetodo.efectivo === "number" ? porMetodo.efectivo : 0;
  const cobradoTransferencia = typeof porMetodo.transferencia === "number" ? porMetodo.transferencia : 0;
  const cobradoTarjeta = typeof porMetodo.tarjeta === "number" ? porMetodo.tarjeta : 0;
  const cobradoOtro = typeof porMetodo.otro === "number" ? porMetodo.otro : 0;

  const paraLaboratorio = leerNumeroRuta(diario, ["separacionDelDia", "paraLaboratorio"], 0);
  const laboratorioCubiertoPorPagos = leerNumeroRuta(
    diario,
    ["separacionDelDia", "laboratorioCubiertoPorPagos"],
    0
  );
  const laboratorioPendiente = leerNumeroRuta(
    diario,
    ["separacionDelDia", "laboratorioPendiente"],
    0
  );

  const paraMama = leerNumeroRuta(diario, ["separacionDelDia", "paraMama"], 0);
  const paraAlicia = leerNumeroRuta(diario, ["separacionDelDia", "paraAlicia"], 0);
  const excedente = leerNumeroRuta(diario, ["separacionDelDia", "excedente"], 0);

  const detalleDiario = leerListaRuta(diario, ["detalle"], []);

  const pagosDelDiaPlanos = useMemo(() => {
    const filas = [];

    for (const bloque of detalleDiario) {
      const tratamiento = bloque?.tratamiento || bloque?.tratamientoId || null;
      const tratamientoId = bloque?.tratamientoId || bloque?.tratamiento?._id || bloque?.tratamiento?.id;

      const paciente = bloque?.paciente || bloque?.tratamiento?.pacienteId || null;
      const pacienteId = paciente?._id || paciente?.id || null;

      const pacienteNombre = paciente?.nombre || "Paciente";
      const descripcionTratamiento = bloque?.tratamiento?.descripcion || "Tratamiento";

      const pagosBloque = Array.isArray(bloque?.pagosDelDia) ? bloque.pagosDelDia : [];

      for (const p of pagosBloque) {
        const asg = p?.asignacion || {};
        filas.push({
          id: p?._id || p?.id,
          fecha: p?.fecha,
          monto: p?.monto || 0,
          metodo: p?.metodo || "otro",
          referencia: p?.referencia,
          notas: p?.notas,
          asignacion: {
            paraLab: asg?.paraLab || 0,
            paraMama: asg?.paraMama || 0,
            paraAlicia: asg?.paraAlicia || 0,
            excedente: asg?.excedente || 0,
          },
          pacienteNombre,
          pacienteId,
          descripcionTratamiento,
          tratamientoId,
          tratamiento,
        });
      }
    }

    filas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    return filas;
  }, [detalleDiario]);

  function setHoy() {
    setFechaDiaria(fechaISOParaInput(new Date()));
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Reportes</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>Mensual, pendientes y cierre diario.</p>
        </div>

        {tab === "diario" ? (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>Fecha</span>
              <input
                type="date"
                value={fechaDiaria}
                onChange={(e) => setFechaDiaria(e.target.value)}
                style={inputFecha}
              />
            </div>

            <button type="button" style={botonSecundario} onClick={setHoy}>
              Hoy
            </button>
          </div>
        ) : (
          <SelectorMesAnio anio={filtro.anio} mes={filtro.mes} onChange={setFiltro} />
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          style={tab === "mensual" ? botonPrimario : botonSecundario}
          onClick={() => setTab("mensual")}
        >
          Reporte mensual
        </button>

        <button
          type="button"
          style={tab === "pendientes" ? botonPrimario : botonSecundario}
          onClick={() => setTab("pendientes")}
        >
          Pendientes
        </button>

        <button
          type="button"
          style={tab === "diario" ? botonPrimario : botonSecundario}
          onClick={() => setTab("diario")}
        >
          Diario
        </button>

        <button type="button" style={botonSecundario} onClick={() => setVerRaw((v) => !v)}>
          {verRaw ? "Ocultar datos técnicos" : "Ver datos técnicos"}
        </button>
      </div>

      {error ? <ErrorMensaje mensaje={error} /> : null}
      {cargando ? <Cargando texto="Cargando reporte..." /> : null}

      {/* ========================= */}
      {/*  TAB: MENSUAL             */}
      {/* ========================= */}
      {!cargando && !error && tab === "mensual" ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <Tarjeta titulo="Total cobrado (pacientes)" valor={formatearMonedaARS(totalCobradoPacientesMes)} />
            <Tarjeta titulo="Laboratorio pagado (mes)" valor={formatearMonedaARS(totalPagadoLaboratorioMes)} />
            <Tarjeta titulo="Saldo pendiente total pacientes" valor={formatearMonedaARS(saldoPendienteTotalPacientes)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <Tarjeta
              titulo="Mamá (mes)"
              valor={`${formatearMonedaARS(totalCobradoMama)} cobrado`}
              ayuda={`Pendiente: ${formatearMonedaARS(totalPendienteMama)} · Correspondiente: ${formatearMonedaARS(
                totalCorrespondienteMama
              )}`}
            />
            <Tarjeta
              titulo="Alicia (mes)"
              valor={`${formatearMonedaARS(totalCobradoAlicia)} cobrado`}
              ayuda={`Pendiente: ${formatearMonedaARS(totalPendienteAlicia)} · Correspondiente: ${formatearMonedaARS(
                totalCorrespondienteAlicia
              )}`}
            />
          </div>

          <div style={cajaBlanca}>
            <h3 style={{ marginTop: 0 }}>Actividad del mes</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <Tarjeta titulo="Total gastos (mes)" valor={formatearMonedaARS(totalGastosMes)} />
              <Tarjeta titulo="Cantidad pagos" valor={String(cantidadPagosMes)} />
              <Tarjeta titulo="Cantidad gastos" valor={String(cantidadGastosMes)} />
            </div>
          </div>

          {verRaw ? (
            <div style={cajaBlanca}>
              <h3 style={{ marginTop: 0 }}>Detalle (raw)</h3>
              <pre style={pre}>{JSON.stringify(reporteMensual, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ========================= */}
      {/*  TAB: PENDIENTES          */}
      {/* ========================= */}
      {!cargando && !error && tab === "pendientes" ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            <BloquePendientes titulo="Pendientes Mamá" items={pendientesMama} paraQuien="mama" />
            <BloquePendientes titulo="Pendientes Alicia" items={pendientesAlicia} paraQuien="alicia" />
          </div>

          {verRaw ? (
            <div style={cajaBlanca}>
              <h3 style={{ marginTop: 0 }}>Detalle (raw)</h3>
              <pre style={pre}>{JSON.stringify(pendientes, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ========================= */}
      {/*  TAB: DIARIO              */}
      {/* ========================= */}
      {!cargando && !error && tab === "diario" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {/* Resumen rápido del día */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <Tarjeta titulo="Total cobrado hoy" valor={formatearMonedaARS(totalCobradoPacientesDia)} />
            <Tarjeta titulo="Pagar Laboratorio" valor={formatearMonedaARS(paraLaboratorio)} />
            <Tarjeta
              titulo="Excedente"
              valor={formatearMonedaARS(excedente)}
              ayuda="Si el pago supera lo que faltaba cubrir."
            />
          </div>

          {/* Por método */}
          <div style={cajaBlanca}>
            <h3 style={{ marginTop: 0 }}>En mano hoy (por método)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
              <Tarjeta titulo="Efectivo" valor={formatearMonedaARS(cobradoEfectivo)} />
              <Tarjeta titulo="Transferencia" valor={formatearMonedaARS(cobradoTransferencia)} />
              <Tarjeta titulo="Tarjeta" valor={formatearMonedaARS(cobradoTarjeta)} />
              <Tarjeta titulo="Otro" valor={formatearMonedaARS(cobradoOtro)} />
            </div>
          </div>

          {/* Separación del día */}
          <div style={cajaBlanca}>
            <h3 style={{ marginTop: 0 }}>Separación sugerida del día</h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              <Tarjeta titulo="Para Mamá" valor={formatearMonedaARS(paraMama)} />
              <Tarjeta titulo="Para Alicia" valor={formatearMonedaARS(paraAlicia)} />
              <Tarjeta titulo="Pagar Laboratorio" valor={formatearMonedaARS(paraLaboratorio)} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                marginTop: 10,
              }}
            >
              <Tarjeta
                titulo="Laboratorio cubierto por pagos"
                valor={formatearMonedaARS(laboratorioCubiertoPorPagos)}
              />
              <Tarjeta
                titulo="Laboratorio no cubierto por pagos"
                valor={formatearMonedaARS(laboratorioPendiente)}
              />
              <Tarjeta
                titulo="Excedente"
                valor={formatearMonedaARS(excedente)}
                ayuda="Si el pago supera lo que faltaba cubrir."
              />
            </div>

            <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
              Pagar Laboratorio se calcula a partir de los gastos de laboratorio cargados en el día. La separación por
              pagos usa el waterfall (lab → mamá → Alicia) aplicando los pagos del día sobre cada tratamiento.
            </div>
          </div>

          {/* Pagos del día con “nota” de separación */}
          <div style={cajaBlanca}>
            <h3 style={{ marginTop: 0 }}>Pagos del día (con separación)</h3>

            {pagosDelDiaPlanos.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {pagosDelDiaPlanos.map((p, idx) => {
                  const asg = p.asignacion || {};
                  const tratamientoId = p.tratamientoId;
                  const pacienteId = p.pacienteId;

                  const nota = `De este pago: ${formatearMonedaARS(asg.paraLab)} lab + ${formatearMonedaARS(
                    asg.paraMama
                  )} mamá + ${formatearMonedaARS(asg.paraAlicia)} Alicia${
                    asg.excedente > 0 ? ` (+ ${formatearMonedaARS(asg.excedente)} excedente)` : ""
                  }`;

                  return (
                    <div key={p.id || idx} style={fila}>
                      <div style={{ display: "grid", gap: 2 }}>
                        <strong>
                          {p.pacienteNombre} · {formatearMonedaARS(p.monto)}{" "}
                          <span style={{ fontSize: 12, color: "#6b7280" }}>({p.metodo})</span>
                        </strong>

                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {fechaCorta(p.fecha)} · {p.descripcionTratamiento}
                          {p.referencia ? ` · ${p.referencia}` : ""}
                          {p.notas ? ` · ${p.notas}` : ""}
                        </span>

                        <span style={{ fontSize: 12, fontWeight: 900 }}>{nota}</span>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                          {tratamientoId ? (
                            <Link to={`/tratamientos/${tratamientoId}`} style={{ fontSize: 12 }}>
                              Ver tratamiento →
                            </Link>
                          ) : null}
                          {pacienteId ? (
                            <Link to={`/pacientes/${pacienteId}`} style={{ fontSize: 12 }}>
                              Ver paciente →
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#6b7280" }}>No hay pagos cargados para esta fecha.</div>
            )}
          </div>

          {verRaw ? (
            <div style={cajaBlanca}>
              <h3 style={{ marginTop: 0 }}>Detalle (raw)</h3>
              <pre style={pre}>{JSON.stringify(reporteDiario, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function BloquePendientes({ titulo, items, paraQuien }) {
  const ordenados = [...items].sort((a, b) => obtenerPendiente(b, paraQuien) - obtenerPendiente(a, paraQuien));

  return (
    <div style={cajaBlanca}>
      <h3 style={{ marginTop: 0 }}>{titulo}</h3>

      {ordenados.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {ordenados.map((it, idx) => {
            const nombrePaciente = obtenerTextoPaciente(it);
            const descripcion = obtenerTextoTratamiento(it);
            const pendiente = obtenerPendiente(it, paraQuien);

            const tratamientoId = it?.tratamientoId || it?.tratamiento?._id || it?.tratamiento?.id;

            return (
              <div key={it?._id || it?.id || tratamientoId || idx} style={fila}>
                <div style={{ display: "grid" }}>
                  <strong>{nombrePaciente}</strong>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{descripcion}</span>

                  {tratamientoId ? (
                    <Link to={`/tratamientos/${tratamientoId}`} style={{ fontSize: 12, marginTop: 4 }}>
                      Ver tratamiento →
                    </Link>
                  ) : null}
                </div>

                <strong>{formatearMonedaARS(pendiente)}</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: "#6b7280" }}>No hay pendientes para este mes.</div>
      )}
    </div>
  );
}

function Tarjeta({ titulo, valor, ayuda }) {
  return (
    <div style={cajaBlanca}>
      <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>{titulo}</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{valor}</div>
      {ayuda ? <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>{ayuda}</div> : null}
    </div>
  );
}

/* Estilos */
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

const pre = {
  margin: 0,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#0b1020",
  color: "#e5e7eb",
  overflow: "auto",
  fontSize: 12,
};

const inputFecha = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
};
