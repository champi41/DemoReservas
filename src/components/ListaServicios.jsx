import React from "react";
import Servicio from "./Servicio";

const ListaServicios = ({
  servicios,
  onEditar,
  onEliminar,
  esVistaCliente,
}) => {
  return (
    <div className="listaServicios">
      

      {servicios.map((servicio, index) => (
        <Servicio
          key={servicio.id}
          servicio={servicio}
          onEditar={onEditar}
          onEliminar={onEliminar}
          esVistaCliente={esVistaCliente}
          index={index}
        />
      ))}
    </div>
  );
};

export default ListaServicios;
