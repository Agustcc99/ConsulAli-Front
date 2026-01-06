export default function ErrorMensaje({ mensaje }) {
    if (!mensaje) return null;
  
    return (
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          fontWeight: 700
        }}
      >
        {mensaje}
      </div>
    );
  }
  