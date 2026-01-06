export function formatearMonedaARS(valor) {
    const numero = Number(valor ?? 0);
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(numero);
  }
  