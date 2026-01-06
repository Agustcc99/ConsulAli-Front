import { Navigate, Route, Routes } from "react-router-dom";

import LayoutBase from "../layout/LayoutBase.jsx";
import RutaProtegida from "../auth/RutaProtegida.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import EstablecerPasswordPage from "../pages/EstablecerPasswordPage.jsx";
import AdminUsuariosPage from "../pages/AdminUsuariosPage.jsx";

import PacientesPage from "../pages/PacientesPage.jsx";
import PacienteDetallePage from "../pages/PacienteDetallePage.jsx";
import PacienteFormPage from "../pages/PacienteFormPage.jsx";
import ReportesPage from "../pages/ReportesPage.jsx";
import NoEncontradoPage from "../pages/NoEncontradoPage.jsx";
import TratamientoFormPage from "../pages/TratamientoFormPage.jsx";
import TratamientoDetallePage from "../pages/TratamientoDetallePage.jsx";
import CuentaPage from "../pages/CuentaPage.jsx";


export default function AppRouter() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/establecer-password" element={<EstablecerPasswordPage />} />

      {/* Todo lo demás requiere login */}
      <Route element={<RutaProtegida />}>
        <Route element={<LayoutBase />}>
          <Route index element={<Navigate to="/pacientes" replace />} />

          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/pacientes/nuevo" element={<PacienteFormPage />} />
          <Route path="/pacientes/:id/editar" element={<PacienteFormPage />} />
          <Route path="/pacientes/:id" element={<PacienteDetallePage />} />
          <Route path="/pacientes/:id/tratamientos/nuevo" element={<TratamientoFormPage />} />
          <Route path="/tratamientos/:id" element={<TratamientoDetallePage />} />

          <Route path="/reportes" element={<ReportesPage />} />

          {/* Cuenta (usuario cambia su contraseña) */}
          <Route path="/cuenta" element={<CuentaPage />} />

          {/* Admin */}
          <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />

          <Route path="*" element={<NoEncontradoPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
