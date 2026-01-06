export default function SelectorMesAnio({ anio, mes, onChange }) {
    const meses = [
      { n: 1, label: "Enero" },
      { n: 2, label: "Febrero" },
      { n: 3, label: "Marzo" },
      { n: 4, label: "Abril" },
      { n: 5, label: "Mayo" },
      { n: 6, label: "Junio" },
      { n: 7, label: "Julio" },
      { n: 8, label: "Agosto" },
      { n: 9, label: "Septiembre" },
      { n: 10, label: "Octubre" },
      { n: 11, label: "Noviembre" },
      { n: 12, label: "Diciembre" },
    ];
  
    const anios = [];
    const anioActual = new Date().getFullYear();
    for (let a = anioActual - 2; a <= anioActual + 1; a++) anios.push(a);
  
    function cambiarMes(e) {
      onChange({ anio, mes: Number(e.target.value) });
    }
  
    function cambiarAnio(e) {
      onChange({ anio: Number(e.target.value), mes });
    }
  
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <select value={mes} onChange={cambiarMes} style={input}>
          {meses.map((m) => (
            <option key={m.n} value={m.n}>
              {m.label}
            </option>
          ))}
        </select>
  
        <select value={anio} onChange={cambiarAnio} style={input}>
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  const input = {
    padding: 10,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    fontWeight: 800,
  };
  