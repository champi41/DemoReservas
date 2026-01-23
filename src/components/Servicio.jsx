const Servicio = ({ servicio, alSeleccionar, accion }) => {
  const { nombre, precio, duracion, id } = servicio;
  return (
    <div className="servicio" id={id}>
      <div className="infoServicio">
        <h3>{nombre}</h3>
        <p>{duracion} min</p>
      </div>
      <div className="precio">
        <span>${precio}</span>
        <button
          className={accion === "Eliminar" ? "btnEliminar" : "btnSeleccionar"}
          onClick={
            accion === "Eliminar"
              ? () => alSeleccionar(servicio.id)
              : () => alSeleccionar(servicio)
          }
        >
          {accion}
        </button>
      </div>
    </div>
  );
};

export default Servicio;
