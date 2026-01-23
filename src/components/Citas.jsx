const Citas = ({
  citas,
  menuAbierto,
  setMenuAbierto,
  borrarCita,
  gestionarCita,
}) => {
  return (
    <section className="seccion-citas">
      <h2>Reservas</h2>
      <div className="listaCitas">
        {citas.length === 0 ? (
          <p>No hay citas agendadas aún.</p>
        ) : (
          citas.map((cita) => (
            <div data-estado={cita.estado} key={cita.id} className="cita">
              <div className="descCita">
                <div className="infoCita">
                  <p id="nombre">{cita.clienteNombre}</p>
                  <p id="servicio">{cita.servicioNombre}</p>
                  <p id="tiempo">
                    {cita.horaCita}, {cita.fechaCita}
                  </p>
                </div>
                <div className="estadoCita">
                  <span>{cita.estado}</span>
                  <button
                    className="btnGestionar"
                    onClick={() =>
                      setMenuAbierto(menuAbierto === cita.id ? null : cita.id)
                    }
                  >
                    Gestionar
                  </button>
                </div>
              </div>

              {menuAbierto === cita.id && (
                <div className="menu-flotante">
                  {cita.estado === "cancelada" ? (
                    <>
                      <button onClick={() => borrarCita(cita.id)} id="borrar">
                        Borrar
                      </button>
                      <button
                        id="contactar"
                        onClick={() => gestionarCita(cita, "contacto")}
                      >
                        Contactar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => gestionarCita(cita, "cancelada")}
                        id="cancelar"
                      >
                        Cancelar
                      </button>
                      <button
                        id="contactar"
                        onClick={() => gestionarCita(cita, "contacto")}
                      >
                        Contactar
                      </button>
                      {cita.estado !== "confirmada" && (
                        <button
                          id="confirmar"
                          onClick={() => gestionarCita(cita, "confirmada")}
                        >
                          Confirmar
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Citas;
