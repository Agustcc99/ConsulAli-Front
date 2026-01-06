import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function RutaProtegida() {
  const { estaAutenticado, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return null; // o un loader

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
