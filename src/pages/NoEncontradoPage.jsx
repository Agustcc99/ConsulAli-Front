import { Link } from "react-router-dom";

export default function NoEncontradoPage() {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>404</h2>
      <p style={{ color: "#6b7280" }}>La página no existe.</p>
      <Link to="/pacientes">Volver a Pacientes</Link>
    </div>
  );
}
