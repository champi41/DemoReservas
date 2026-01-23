import ListaServicios from "../components/ListaServicios";
import FormularioReserva from "../components/FormularioReserva";
import SeleccionBarbero from "../components/SeleccionBarbero";
import { useState } from "react";

export const VistaCliente = () => {
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);

  // Función para resetear todo al finalizar o cancelar
  const limpiarSeleccion = () => {
    setServicioSeleccionado(null);
    setBarberoSeleccionado(null);
  };

  return (
    <div className="vistaCliente">
      <header className="headerMain">
        <h1>Barbería Demo</h1>
      </header>

      <main>
        <h2>Nuestros Servicios</h2>
        <ListaServicios
          alSeleccionar={setServicioSeleccionado}
          accion={"Seleccionar"}
        />
      </main>

      {/* PASO 1: Si eligió servicio pero NO barbero, mostramos el selector de profesional */}
      {servicioSeleccionado && !barberoSeleccionado && (
        <SeleccionBarbero
          alSeleccionar={setBarberoSeleccionado}
          alCancelar={() => setServicioSeleccionado(null)}
        />
      )}

      {/* PASO 2: Si ya eligió ambos, mostramos el formulario final */}
      {servicioSeleccionado && barberoSeleccionado && (
        <FormularioReserva
          servicioSeleccionado={servicioSeleccionado}
          barberoSeleccionado={barberoSeleccionado} // Se lo pasamos al formulario
          setServicioSeleccionado={limpiarSeleccion} // Limpia ambos estados al cerrar
        />
      )}
    </div>
  );
};
