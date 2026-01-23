import { VistaCliente } from "./pages/VistaCliente";
import PanelBarbero from "./pages/PanelBarbero";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import GestionCita from "./components/GestionCita";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para los clientes que reservan */}
        <Route path="/" element={<VistaCliente />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mi-cita/:idCita" element={<GestionCita />} />
        {/* Solo se puede entrar a /admin si pasas por el ProtectedRoute */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <PanelBarbero />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
