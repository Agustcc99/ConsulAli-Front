import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Cargando from "../components/Cargando.jsx";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import { formatearMonedaARS } from "../utils/moneda.js";
import { obtenerResumenFinancieroTratamiento } from "../api/tratamientosApi.js";
import { crearPago, eliminarPago } from "../api/pagosApi.js";
import { crearGasto, eliminarGasto } from "../api/gastosApi.js";

function fechaCorta(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR");
}

function convertirEnteroPositivo(valorTexto) {
  const soloDigitos = String(valorTexto ?? "").replace(/[^\d]/g, "");
  if (!soloDigitos) return null;
  const n = Number(soloDigitos);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

function convertirEnteroNoNegativo(valorTexto) {
  const soloDigitos = String(valorTexto ?? "").replace(/[^\d]/g, "");
  if (!soloDigitos) return 0;
  const n = Number(soloDigitos);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

export default function TratamientoDetallePage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // UI toggles
  const [mostrarFormPago, setMostrarFormPago] = useState(false);
  const [mostrarFormGasto, setMostrarFormGasto] = useState(false);

  // Confirm modal
  const [confirmacion, setConfirmacion] = useState({
    abierta: false,
    titulo: "",
    mensaje: "",
    onConfirm: null,
  });

  // Form pago
  const [montoPagoTexto, setMontoPagoTexto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [notasPago, setNotasPago] = useState("");
  const [guardandoPago, setGuardandoPago] = useState(false);

  // Form gasto
  const [tipoGasto, setTipoGasto] = useState("laboratorio");
  const [descripcionGasto, setDescripcionGasto] = useState("");
  const [montoGastoTexto, setMontoGastoTexto] = useState("");
  const [pagadoGasto, setPagadoGasto] = useState(false);
  const [guardandoGasto, setGuardandoGasto] = useState(false);

  const montoPagoRef = useRef(null);
  const montoGastoRef = useRef(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const res = await obtenerResumenFinancieroTratamiento(id);
      setData(res);
    } catch (e) {
      setError(e?.message || "No se pudo cargar el resumen del tratamiento.");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const tratamiento = data?.tratamiento || {};
  const resumen = data?.resumen || {};
  const pagos = Array.isArray(data?.pagos) ? data.pagos : [];
  const gastos = Array.isArray(data?.gastos) ? data.gastos : [];

  const paciente = tratamiento?.pacienteId || null;
  const pacienteNombre = paciente?.nombre || "Paciente";
  const pacienteId = paciente?._id || paciente?.id || null;

  const tituloTratamiento = useMemo(
    () => tratamiento?.descripcion || "Tratamiento",
    [tratamiento?.descripcion]
  );

  const objetivo = resumen?.objetivo || {};
  const pagado = resumen?.pagado || {};
  const saldo = resumen?.saldo || {};
  const control = resumen?.control || {};

  // ✅ Distribución POR PAGO (waterfall acumulado)
  const distribucionPorPago = useMemo(() => {
    const objetivoLab = objetivo?.lab ?? 0;
    const objetivoMama = objetivo?.mama ?? 0;
    const objetivoAlicia = objetivo?.alicia ?? 0;

    // orden cronológico
    const pagosOrdenados = [...pagos].sort(
      (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    let cubiertoLab = 0;
    let cubiertoMama = 0;
    let cubiertoAlicia = 0;

    const mapa = new Map();

    for (const pago of pagosOrdenados) {
      const idPago = String(pago._id || pago.id);
      const montoPago = pago?.monto ?? 0;

      let resto = montoPago;

      const faltaLab = Math.max(objetivoLab - cubiertoLab, 0);
      const paraLab = Math.min(resto, faltaLab);
      resto -= paraLab;

      const faltaMama = Math.max(objetivoMama - cubiertoMama, 0);
      const paraMama = Math.min(resto, faltaMama);
      resto -= paraMama;

      const faltaAlicia = Math.max(objetivoAlicia - cubiertoAlicia, 0);
      const paraAlicia = Math.min(resto, faltaAlicia);
      resto -= paraAlicia;

      cubiertoLab += paraLab;
      cubiertoMama += paraMama;
      cubiertoAlicia += paraAlicia;

      const excedente = Math.max(resto, 0);

      mapa.set(idPago, { paraLab, paraMama, paraAlicia, excedente });
    }

    return mapa;
  }, [pagos, objetivo?.lab, objetivo?.mama, objetivo?.alicia]);

  const totalPagosLocal = useMemo(
    () => pagos.reduce((acc, p) => acc + (p?.monto || 0), 0),
    [pagos]
  );

  const totalGastosLocal = useMemo(
    () => gastos.reduce((acc, g) => acc + (g?.monto || 0), 0),
    [gastos]
  );

  const cantidadGastosLab = useMemo(
    () => gastos.filter((g) => g?.tipo === "laboratorio").length,
    [gastos]
  );

  const hayPagos = totalPagosLocal > 0;
  const labReal = resumen?.labReal ?? 0;

  const labCubierto = (saldo?.lab ?? 0) <= 0;
  const mamaCubierta = (saldo?.mama ?? 0) <= 0;
  const aliciaCubierta = (saldo?.alicia ?? 0) <= 0;

  const mostrarAvisoLabFaltante = hayPagos && labReal === 0 && cantidadGastosLab === 0;

  function abrirConfirmacion({ titulo, mensaje, onConfirm }) {
    setConfirmacion({ abierta: true, titulo, mensaje, onConfirm });
  }

  function cerrarConfirmacion() {
    setConfirmacion({ abierta: false, titulo: "", mensaje: "", onConfirm: null });
  }

  async function onCrearPago(e) {
    e.preventDefault();
    setError("");

    const monto = convertirEnteroPositivo(montoPagoTexto);
    if (monto === null) return setError("monto debe ser un entero > 0");
    if (!metodoPago) return setError("metodo es obligatorio");

    setGuardandoPago(true);
    try {
      await crearPago({
        tratamientoId: id,
        monto,
        metodo: metodoPago,
        referencia: referenciaPago.trim() || undefined,
        notas: notasPago.trim() || undefined,
      });

      setMontoPagoTexto("");
      setReferenciaPago("");
      setNotasPago("");

      await cargar();
    } catch (e2) {
      setError(e2?.message || "No se pudo crear el pago.");
    } finally {
      setGuardandoPago(false);
    }
  }

  async function confirmarEliminarPago(idPago) {
    abrirConfirmacion({
      titulo: "Eliminar pago",
      mensaje: "¿Seguro que querés eliminar este pago? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          await eliminarPago(idPago);
          await cargar();
        } catch (e) {
          setError(e?.message || "No se pudo eliminar el pago.");
        } finally {
          cerrarConfirmacion();
        }
      },
    });
  }

  async function onCrearGasto(e) {
    e.preventDefault();
    setError("");

    const monto = convertirEnteroNoNegativo(montoGastoTexto);
    if (monto === null) return setError("monto debe ser un entero >= 0");

    setGuardandoGasto(true);
    try {
      await crearGasto({
        tratamientoId: id,
        tipo: tipoGasto,
        descripcion: descripcionGasto.trim() || undefined,
        monto,
        pagado: !!pagadoGasto,
      });

      setDescripcionGasto("");
      setMontoGastoTexto("");
      setPagadoGasto(false);

      await cargar();
    } catch (e2) {
      setError(e2?.message || "No se pudo crear el gasto.");
    } finally {
      setGuardandoGasto(false);
    }
  }

  async function confirmarEliminarGasto(idGasto) {
    abrirConfirmacion({
      titulo: "Eliminar gasto",
      mensaje: "¿Seguro que querés eliminar este gasto? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          await eliminarGasto(idGasto);
          await cargar();
        } catch (e) {
          setError(e?.message || "No se pudo eliminar el gasto.");
        } finally {
          cerrarConfirmacion();
        }
      },
    });
  }

  function abrirFormPago() {
    setMostrarFormPago(true);
    setTimeout(() => montoPagoRef.current?.focus(), 50);
  }

  function abrirFormGastoLab() {
    setTipoGasto("laboratorio");
    setMostrarFormGasto(true);
    setTimeout(() => montoGastoRef.current?.focus(), 50);
  }

  function abrirFormGasto() {
    setMostrarFormGasto(true);
    setTimeout(() => montoGastoRef.current?.focus(), 50);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{tituloTratamiento}</h2>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            {pacienteNombre} · Estado: <b>{tratamiento?.estado || "-"}</b> · Inicio: {fechaCorta(tratamiento?.fechaInicio)}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link to="/pacientes" style={{ textDecoration: "none" }}>
            <button type="button" style={botonSecundario}>Pacientes</button>
          </Link>

          {pacienteId ? (
            <Link to={`/pacientes/${pacienteId}`} style={{ textDecoration: "none" }}>
              <button type="button" style={botonSecundario}>Volver al paciente</button>
            </Link>
          ) : null}
        </div>
      </div>

      {error ? <ErrorMensaje mensaje={error} /> : null}
      {cargando ? <Cargando texto="Cargando..." /> : null}

      {!cargando && data ? (
        <>
          {/* Totales principales */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <Tarjeta titulo="Precio paciente" valor={formatearMonedaARS(tratamiento?.precioPaciente ?? 0)} />
            <Tarjeta titulo="Total pagado" valor={formatearMonedaARS(resumen?.totalPagado ?? totalPagosLocal)} />
            <Tarjeta titulo="Saldo paciente" valor={formatearMonedaARS(saldo?.paciente ?? 0)} />
          </div>

          {/* Distribución */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <Tarjeta
              titulo="Laboratorio real"
              valor={formatearMonedaARS(labReal)}
              ayuda={`${cantidadGastosLab} gasto(s) lab · Total gastos: ${formatearMonedaARS(totalGastosLocal)}`}
            />
            <Tarjeta
              titulo="Mamá (limpio)"
              valor={formatearMonedaARS(objetivo?.mama ?? 0)}
              ayuda="Se ajusta automáticamente si cambia el laboratorio."
            />
            <Tarjeta titulo="Alicia (fijo)" valor={formatearMonedaARS(objetivo?.alicia ?? 0)} />
          </div>

          {/* Pagado por partes */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            <Tarjeta titulo="Pagado lab" valor={formatearMonedaARS(pagado?.lab ?? 0)} />
            <Tarjeta titulo="Pagado mamá" valor={formatearMonedaARS(pagado?.mama ?? 0)} />
            <Tarjeta titulo="Pagado Alicia" valor={formatearMonedaARS(pagado?.alicia ?? 0)} />
          </div>

          {/* Aviso de lab faltante */}
          {mostrarAvisoLabFaltante ? (
            <div style={alertaAmarilla}>
              ⚠️ Todavía no cargaste el laboratorio. Cuando lo cargues, el “Mamá (limpio)” puede cambiar.
              <div style={{ marginTop: 8 }}>
                <button type="button" style={botonPrimario} onClick={abrirFormGastoLab}>
                  Cargar gasto de lab
                </button>
              </div>
            </div>
          ) : null}

          {/* Cobertura */}
          <div style={cajaBlanca}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h3 style={{ marginTop: 0, marginBottom: 0 }}>Cobertura</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip label="Lab" ok={labCubierto} saldo={saldo?.lab} />
                <Chip label="Mamá" ok={mamaCubierta} saldo={saldo?.mama} />
                <Chip label="Alicia" ok={aliciaCubierta} saldo={saldo?.alicia} />
              </div>
            </div>

            <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
              Diferencia: <b>{control?.diferencia ?? 0}</b> · Ajuste aplicado a:{" "}
              <b>{tratamiento?.reglaAjuste || "mama"}</b>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={botonPrimario} onClick={abrirFormPago}>
              Agregar pago
            </button>
            <button type="button" style={botonPrimario} onClick={abrirFormGastoLab}>
              Agregar gasto lab
            </button>
            <button type="button" style={botonSecundario} onClick={abrirFormGasto}>
              Agregar gasto
            </button>
            <button type="button" style={botonSecundario} onClick={cargar}>
              Refrescar
            </button>
          </div>

          {/* Secciones: Pagos + Gastos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {/* Pagos */}
            <div style={cajaBlanca}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <h3 style={{ marginTop: 0, marginBottom: 0 }}>
                  Pagos <span style={badge}>{pagos.length}</span>
                </h3>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  Total: <b>{formatearMonedaARS(totalPagosLocal)}</b>
                </div>
              </div>

              {mostrarFormPago ? (
                <form onSubmit={onCrearPago} style={{ display: "grid", gap: 8, marginTop: 10, marginBottom: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input
                      ref={montoPagoRef}
                      value={montoPagoTexto}
                      onChange={(e) => setMontoPagoTexto(e.target.value)}
                      placeholder="Monto (entero > 0)"
                      inputMode="numeric"
                      style={input}
                    />
                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={input}>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <input
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    placeholder="Referencia (opcional)"
                    style={input}
                  />
                  <input
                    value={notasPago}
                    onChange={(e) => setNotasPago(e.target.value)}
                    placeholder="Notas (opcional)"
                    style={input}
                  />

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      style={botonSecundario}
                      onClick={() => setMostrarFormPago(false)}
                      disabled={guardandoPago}
                    >
                      Cerrar
                    </button>
                    <button type="submit" style={botonPrimario} disabled={guardandoPago}>
                      {guardandoPago ? "Guardando..." : "Guardar pago"}
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" style={botonSecundario} onClick={abrirFormPago}>
                  + Nuevo pago
                </button>
              )}

              {pagos.length ? (
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {pagos.map((p) => {
                    const idPago = String(p._id || p.id);
                    const dist = distribucionPorPago.get(idPago) || {
                      paraLab: 0,
                      paraMama: 0,
                      paraAlicia: 0,
                      excedente: 0,
                    };

                    return (
                      <div key={p._id || p.id} style={fila}>
                        <div style={{ display: "grid", gap: 4 }}>
                          <strong>{formatearMonedaARS(p.monto ?? 0)}</strong>

                          <span style={{ fontSize: 12, color: "#6b7280" }}>
                            {fechaCorta(p.fecha)} · {p.metodo}
                            {p.referencia ? ` · ${p.referencia}` : ""}
                            {p.notas ? ` · ${p.notas}` : ""}
                          </span>

                          {/* ✅ Nota de distribución por pago */}
                          <span style={{ fontSize: 12, color: "#6b7280" }}>
                            Distribución de este pago:{" "}
                            <b>Lab</b> {formatearMonedaARS(dist.paraLab)} ·{" "}
                            <b>Mamá</b> {formatearMonedaARS(dist.paraMama)} ·{" "}
                            <b>Alicia</b> {formatearMonedaARS(dist.paraAlicia)}
                            {dist.excedente > 0 ? ` · Excedente ${formatearMonedaARS(dist.excedente)}` : ""}
                          </span>
                        </div>

                        <button
                          type="button"
                          style={botonPeligro}
                          onClick={() => confirmarEliminarPago(p._id || p.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: "#6b7280", marginTop: 10 }}>Sin pagos cargados.</div>
              )}
            </div>

            {/* Gastos */}
            <div style={cajaBlanca}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <h3 style={{ marginTop: 0, marginBottom: 0 }}>
                  Gastos <span style={badge}>{gastos.length}</span>
                </h3>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  Total: <b>{formatearMonedaARS(totalGastosLocal)}</b>
                </div>
              </div>

              {mostrarFormGasto ? (
                <form onSubmit={onCrearGasto} style={{ display: "grid", gap: 8, marginTop: 10, marginBottom: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <select value={tipoGasto} onChange={(e) => setTipoGasto(e.target.value)} style={input}>
                      <option value="laboratorio">Laboratorio</option>
                      <option value="otro">Otro</option>
                    </select>

                    <input
                      ref={montoGastoRef}
                      value={montoGastoTexto}
                      onChange={(e) => setMontoGastoTexto(e.target.value)}
                      placeholder="Monto (entero >= 0)"
                      inputMode="numeric"
                      style={input}
                    />
                  </div>

                  <input
                    value={descripcionGasto}
                    onChange={(e) => setDescripcionGasto(e.target.value)}
                    placeholder="Descripción (opcional)"
                    style={input}
                  />

                  <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800 }}>
                    <input type="checkbox" checked={pagadoGasto} onChange={(e) => setPagadoGasto(e.target.checked)} />
                    Ya pagado
                  </label>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      style={botonSecundario}
                      onClick={() => setMostrarFormGasto(false)}
                      disabled={guardandoGasto}
                    >
                      Cerrar
                    </button>
                    <button type="submit" style={botonPrimario} disabled={guardandoGasto}>
                      {guardandoGasto ? "Guardando..." : "Guardar gasto"}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <button type="button" style={botonSecundario} onClick={abrirFormGastoLab}>
                    + Gasto lab
                  </button>
                  <button type="button" style={botonSecundario} onClick={abrirFormGasto}>
                    + Gasto
                  </button>
                </div>
              )}

              {gastos.length ? (
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {gastos.map((g) => (
                    <div key={g._id || g.id} style={fila}>
                      <div style={{ display: "grid" }}>
                        <strong>{formatearMonedaARS(g.monto ?? 0)}</strong>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {fechaCorta(g.fecha)} · {g.tipo}
                          {g.pagado ? " · pagado" : ""}
                          {g.descripcion ? ` · ${g.descripcion}` : ""}
                        </span>
                      </div>
                      <button type="button" style={botonPeligro} onClick={() => confirmarEliminarGasto(g._id || g.id)}>
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#6b7280", marginTop: 10 }}>Sin gastos cargados.</div>
              )}
            </div>
          </div>

          {/* Modal confirmación */}
          <ConfirmacionModal
            abierta={confirmacion.abierta}
            titulo={confirmacion.titulo}
            mensaje={confirmacion.mensaje}
            onCancelar={cerrarConfirmacion}
            onConfirmar={confirmacion.onConfirm}
          />
        </>
      ) : null}
    </div>
  );
}

function Tarjeta({ titulo, valor, ayuda }) {
  return (
    <div style={cajaBlanca}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>{titulo}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{valor}</div>
      {ayuda ? <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>{ayuda}</div> : null}
    </div>
  );
}

function Chip({ label, ok, saldo }) {
  const esOk = ok === true;
  const fondo = esOk ? "#dcfce7" : "#fee2e2";
  return (
    <span style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #e5e7eb", background: fondo, fontWeight: 900 }}>
      {label}: {esOk ? "✅" : "❌"} ({formatearMonedaARS(saldo ?? 0)})
    </span>
  );
}

function ConfirmacionModal({ abierta, titulo, mensaje, onCancelar, onConfirmar }) {
  if (!abierta) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ marginTop: 0 }}>{titulo}</h3>
        <p style={{ margin: "8px 0 12px", color: "#374151" }}>{mensaje}</p>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" style={botonSecundario} onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            style={botonPeligroFuerte}
            onClick={() => (typeof onConfirmar === "function" ? onConfirmar() : onCancelar())}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

const cajaBlanca = { background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 };
const input = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", outline: "none" };

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

const badge = {
  display: "inline-block",
  marginLeft: 8,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
  fontSize: 12,
  fontWeight: 900,
  color: "#111827",
};

const alertaAmarilla = {
  background: "#fffbeb",
  border: "1px solid #f59e0b",
  borderRadius: 14,
  padding: 12,
  color: "#92400e",
  fontWeight: 800,
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

const botonPeligro = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ef4444",
  background: "white",
  color: "#b91c1c",
  fontWeight: 900,
  cursor: "pointer",
};

const botonPeligroFuerte = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #b91c1c",
  background: "#b91c1c",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(17, 24, 39, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 50,
};

const modal = {
  width: "min(520px, 100%)",
  background: "white",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  padding: 14,
  boxShadow: "0 20px 60px rgba(0,0,0,.18)",
};
