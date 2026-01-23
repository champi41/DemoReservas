import React from "react";

const hoy = new Date().toISOString().split("T")[0];
const fechaMaxima = new Date();
fechaMaxima.setDate(fechaMaxima.getDate() + 30);
const max = fechaMaxima.toISOString().split("T")[0];

const Horarios = ({
  fechaBloqueo,
  setFechaBloqueo,
  horariosBase,
  bloqueos,
  toggleBloqueo,
  citas,
}) => {
  const obtenerEstadoHora = (hora) => {
    // 1. Prioridad: Si el barbero bloqueó, se ve negro
    if (bloqueos.includes(hora)) return "bloqueada";

    // 2. Buscar citas activas
    const citaEnEstaHora = citas.find(
      (c) => c.fechaCita === fechaBloqueo && c.horaCita === hora
    );

    if (citaEnEstaHora) {
      if (citaEnEstaHora.estado === "confirmada") return "confirmada";
      if (citaEnEstaHora.estado === "pendiente") return "pendiente";
      // Si está cancelada, no retorna nada aquí para que pase al estado 'libre'
    }

    return "libre";
  };

  return (
    <section className="seccion-horario">
      <div className="headerHorario">
        <h2>Horario</h2>
        <input
          type="date"
          value={fechaBloqueo}
          min={hoy}
          max={max}
          onChange={(e) => setFechaBloqueo(e.target.value)}
        />
      </div>

      <div className="gridHoras">
        {horariosBase.map((hora) => {
          const estado = obtenerEstadoHora(hora);
          // Es clickable si está libre (incluye las canceladas) o si ya está bloqueada
          const esClickable = estado === "libre" || estado === "bloqueada";

          return (
            <button
              key={hora}
              disabled={!esClickable}
              className={`btn-hora-admin ${estado}`}
              onClick={() => toggleBloqueo(hora)}
            >
              <span className="hora-texto">{hora}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Horarios;
