import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cargando from "../components/Cargando.jsx";
import ErrorMensaje from "../components/ErrorMensaje.jsx";
import { crearTratamiento } from "../api/tratamientosApi.js";

function convertirEnteroNoNegativo(valorTexto) {
  if (valorTexto === "" || valorTexto === null || valorTexto === undefined) return null;

  const soloDigitos = String(valorTexto).replace(/[^\d]/g, "");
  if (soloDigitos.length === 0) return null;

  const numero = Number(soloDigitos);
  if (!Number.isFinite(numero) || !Number.isInteger(numero) || numero < 0) return null;

  return numero;
}

export default function TratamientoFormPage() {
  const { id: pacienteId } = useParams(); // /pacientes/:id/tratamientos/nuevo
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("ambos");
  const [descripcion, setDescripcion] = useState("");

  const [precioPacienteTexto, setPrecioPacienteTexto] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const descripcionLimpia = useMemo(() => descripcion.trim(), [descripcion]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!pacienteId) return setError("pacienteId es obligatorio (ruta incorrecta).");
    if (!descripcionLimpia) return setError("La descripción es obligatoria.");

    const precioPaciente = convertirEnteroNoNegativo(precioPacienteTexto);
    if (precioPaciente === null) return setError("precioPaciente debe ser un número entero >= 0");

    const payload = {
      pacienteId,
      tipo,
      descripcion: descripcionLimpia,
      precioPaciente,
      // Ya no mandamos montoMama/montoAlicia.
      // Se calcula con: laboratorio (gastos) primero y luego neto 70/30.
      reglaAjuste: "mama", // compat (si lo seguís guardando); hoy no afecta el cálculo nuevo
    };

    setCargando(true);
    try {
      const creado = await crearTratamiento(payload);
      const idCreado = creado?._id || creado?.id;
      if (idCreado) navigate(`/tratamientos/${idCreado}`);
      else navigate(`/pacientes/${pacienteId}`);
    } catch (e2) {
      setError(e2?.message || "No se pudo crear el tratamiento.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0 }}>Nuevo tratamiento</h2>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          El laboratorio se calcula con gastos. Primero se cubre laboratorio y luego el neto se reparte 70/30
          (70% mamá, 30% Alicia).
        </p>
      </div>

      {error ? <ErrorMensaje mensaje={error} /> : null}
      {cargando ? <Cargando texto="Guardando..." /> : null}

      <form onSubmit={handleSubmit} style={cajaBlanca}>
        <div style={grid2}>
          <div>
            <label style={label}>Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={input}>
              {/*Valores válidos según enum del backend */}
              <option value="endodoncia">Endodoncia</option>
              <option value="perno">Perno / Zirconio</option>
              <option value="ambos">Ambos</option>
              <option value="otro">Limpieza / Otro</option>
            </select>
          </div>

          <div style={{ color: "#6b7280", fontSize: 12, alignSelf: "end" }}>
            Distribución: <b>Lab</b> → <b>Neto 70/30</b>
          </div>
        </div>

        <div>
          <label style={label}>Descripción</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Placa + control"
            style={input}
          />
        </div>

        <div style={grid2}>
          <div>
            <label style={label}>Precio paciente</label>
            <input
              value={precioPacienteTexto}
              onChange={(e) => setPrecioPacienteTexto(e.target.value)}
              inputMode="numeric"
              placeholder="Ej: 380000"
              style={input}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            style={botonSecundario}
            onClick={() => navigate(-1)}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button type="submit" style={botonPrimario} disabled={cargando}>
            Crear
          </button>
        </div>
      </form>
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

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const label = { fontWeight: 800, display: "block", marginBottom: 6 };

const input = {
  width: "100%",
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
