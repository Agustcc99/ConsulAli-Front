import { useEffect, useRef, useState } from "react";

export default function ModalEliminarPaciente({
  nombrePaciente,
  onCancelar,
  onConfirmar,
  cargando = false,
  error = "",
}) {
  const [texto, setTexto] = useState("");
  const inputRef = useRef(null);

  // foco al abrir (cuando se monta)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape para cerrar, Enter para confirmar si escribió ELIMINAR
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onCancelar?.();
      if (e.key === "Enter" && texto === "ELIMINAR" && !cargando) onConfirmar?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [texto, cargando, onCancelar, onConfirmar]);

  const puedeConfirmar = texto === "ELIMINAR" && !cargando;
  const inputId = "confirmacion-eliminar";

  return (
    <div
      style={overlay}
      onMouseDown={onCancelar} // click afuera cierra
      role="presentation"
    >
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "grid", gap: 6 }}>
          <h3 style={{ margin: 0 }}>⚠️ Eliminación definitiva</h3>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Vas a borrar a <b>{nombrePaciente}</b> y también <b>TODOS</b> sus tratamientos, pagos y gastos.
            <br />
            Esto <b>NO</b> se puede deshacer.
          </p>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
          <label htmlFor={inputId} style={{ fontWeight: 800 }}>
            Para confirmar, escribí:{" "}
            <span style={{ fontFamily: "monospace" }}>ELIMINAR</span>
          </label>

          <input
            id={inputId}
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="ELIMINAR"
            style={input}
          />

          {error ? <div style={errorBox}>{error}</div> : null}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button type="button" style={botonSecundario} onClick={onCancelar} disabled={cargando}>
            Cancelar
          </button>

          <button
            type="button"
            style={{ ...botonPeligro, opacity: puedeConfirmar ? 1 : 0.5 }}
            onClick={onConfirmar}
            disabled={!puedeConfirmar}
          >
            {cargando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "grid",
  placeItems: "center",
  padding: 12,
  zIndex: 9999,
};

const modal = {
  width: "min(560px, 100%)",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const errorBox = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#991b1b",
  borderRadius: 12,
  padding: 10,
  fontWeight: 800,
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
  background: "#ef4444",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};
