import React from "react";

const Servicio = ({ servicio, onEditar, onEliminar, esVistaCliente, index }) => {
  const { nombre, precio, duracion, descripcion } = servicio;

  return (
    <div className="servicio-card" style={{ "--i": index }}>
      <div className="infoServicio">
        <h3>{nombre}</h3>
        {descripcion && <p className="desc-corta">{descripcion}</p>}
        <span className="badge-duracion">{duracion} min</span>
      </div>

      <div className="acciones-precio">
        <span className="precio">${precio}</span>

        <div className="botones">
          {esVistaCliente ? (
            <button className="btn-reservar" onClick={() => onEditar(servicio)}>
              Reservar
            </button>
          ) : (
            <>
              <div className="editarBorrar">
                <button
                  onClick={() => onEditar(servicio)}
                  className="btn-editar"
                  title="Editar servicio"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onEliminar(servicio.id)}
                  className="btn-eliminar"
                  title="Eliminar servicio"
                >
                  🗑️
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Servicio;
