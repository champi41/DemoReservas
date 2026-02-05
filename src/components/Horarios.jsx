import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const INTERVALO_MINUTOS = 30;

const CONFIG_DEFAULT = {
  lunes: {
    abierto: true,
    apertura: "10:00",
    cierre: "20:00",
    almuerzo: { activo: false, inicio: "13:00", fin: "14:00" },
  },
  martes: {
    abierto: true,
    apertura: "10:00",
    cierre: "20:00",
    almuerzo: { activo: false, inicio: "13:00", fin: "14:00" },
  },
  miercoles: {
    abierto: true,
    apertura: "10:00",
    cierre: "20:00",
    almuerzo: { activo: false, inicio: "13:00", fin: "14:00" },
  },
  jueves: {
    abierto: true,
    apertura: "10:00",
    cierre: "20:00",
    almuerzo: { activo: false, inicio: "13:00", fin: "14:00" },
  },
  viernes: {
    abierto: true,
    apertura: "10:00",
    cierre: "20:00",
    almuerzo: { activo: false, inicio: "13:00", fin: "14:00" },
  },
  sabado: {
    abierto: true,
    apertura: "10:00",
    cierre: "15:00",
    almuerzo: { activo: false, inicio: "13:00", fin: "14:00" },
  },
  domingo: {
    abierto: false,
    apertura: "10:00",
    cierre: "14:00",
    almuerzo: { activo: false, inicio: "13:00", fin: "14:00" },
  },
};

const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

// --- HELPERS ---
const horaAMinutos = (horaStr) => {
  if (!horaStr) return 0;
  const [horas, minutos] = horaStr.split(":").map(Number);
  return horas * 60 + minutos;
};

const Horarios = ({
  usuarioLogueado,
  fechaBloqueo,
  setFechaBloqueo,
  bloqueos,
  toggleBloqueo,
  citas,
}) => {
  const [vista, setVista] = useState("agenda");
  const [configSemanal, setConfigSemanal] = useState(CONFIG_DEFAULT);
  const [cargandoConfig, setCargandoConfig] = useState(true);

  const esAdmin = usuarioLogueado?.rol === "admin";

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const docRef = doc(db, "configuracion", "barberia_1");
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().horarioSemanal) {
          setConfigSemanal(snap.data().horarioSemanal);
        }
      } catch (error) {
        console.error("Error cargando config:", error);
      } finally {
        setCargandoConfig(false);
      }
    };
    cargarConfig();
  }, []);

  const guardarConfiguracion = async () => {
    if (!esAdmin) return;
    try {
      const docRef = doc(db, "configuracion", "barberia_1");
      await updateDoc(docRef, { horarioSemanal: configSemanal });
      alert("¡Horarios del negocio actualizados!");
      setVista("agenda");
    } catch (error) {
      console.error("Error guardando:", error);
    }
  };

  const obtenerNombreDia = (fechaStr) => {
    const date = new Date(fechaStr + "T12:00:00");
    const mapDias = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    return mapDias[date.getDay()];
  };

  const generarSlotsDelDia = () => {
    const nombreDia = obtenerNombreDia(fechaBloqueo);
    const configDia = configSemanal[nombreDia];
    if (!configDia || !configDia.abierto) return [];

    const slots = [];
    let actualMin = horaAMinutos(configDia.apertura);
    const finMin = horaAMinutos(configDia.cierre);

    while (actualMin < finMin) {
      const hh = Math.floor(actualMin / 60)
        .toString()
        .padStart(2, "0");
      const mm = (actualMin % 60).toString().padStart(2, "0");
      const horaStr = `${hh}:${mm}`;

      let esAlmuerzo = false;
      if (configDia.almuerzo?.activo) {
        if (
          horaStr >= configDia.almuerzo.inicio &&
          horaStr < configDia.almuerzo.fin
        ) {
          esAlmuerzo = true;
        }
      }
      if (!esAlmuerzo) slots.push(horaStr);
      actualMin += INTERVALO_MINUTOS;
    }
    return slots;
  };

  // --- LÓGICA DE ESTADOS CON DURACIÓN (Corregida) ---
  const obtenerDataHora = (horaSlot) => {
    const slotMinutos = horaAMinutos(horaSlot);

    // 1. Buscamos si hay una cita que abarque este bloque de tiempo
    const citaOcupando = citas.find((c) => {
      if (c.estado === "cancelada") return false;

      const inicioCita = horaAMinutos(c.horaCita);
      // Importante: usamos 'duracionServicio' que es como lo guardamos en FormularioReserva
      const duracion = parseInt(c.duracionServicio) || 30;
      const finCita = inicioCita + duracion;

      return slotMinutos >= inicioCita && slotMinutos < finCita;
    });

    if (citaOcupando) {
      // Retornamos el estado de la cita para pintar el botón
      return {
        estado: citaOcupando.estado, // 'pendiente' o 'confirmada'
        clickable: false,
        label: citaOcupando.clienteNombre,
      };
    }

    // 2. Si no hay cita, revisamos bloqueos manuales
    if (bloqueos.includes(horaSlot)) {
      return { estado: "bloqueada", clickable: true, label: "Bloqueado" };
    }

    return { estado: "libre", clickable: true, label: horaSlot };
  };

  const handleConfigChange = (dia, campo, valor) => {
    setConfigSemanal((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor },
    }));
  };

  const handleAlmuerzoChange = (dia, campo, valor) => {
    setConfigSemanal((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        almuerzo: { ...prev[dia].almuerzo, [campo]: valor },
      },
    }));
  };
  function capitalizarPrimeraLetra(str) {
    if (str.length === 0) {
      return ""; // Maneja cadenas vacías
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <section className="seccion-horario">
      <div className="titVista">
        <h2>Horario</h2>
        {esAdmin && (
          <select
            id="selectorVista"
            value={vista}
            onChange={(e) => setVista(e.target.value)}
          >
            <option value="agenda">Ver Agenda</option>
            <option value="config">Configurar Local</option>
          </select>
        )}
      </div>

      {vista === "agenda" && (
        <div className="agenda-container">
          <div className="headerHorario">
            <div className="info-dia">
              <h3>{capitalizarPrimeraLetra(obtenerNombreDia(fechaBloqueo))}</h3>
            </div>
            <input
              type="date"
              value={fechaBloqueo}
              onChange={(e) => setFechaBloqueo(e.target.value)}
              className="input-date-admin"
            />
          </div>

          <div className="gridHoras">
            {generarSlotsDelDia().length === 0 ? (
              <p className="text-muted">El local está cerrado este día.</p>
            ) : (
              generarSlotsDelDia().map((hora, index) => {
                const { estado, clickable, label } = obtenerDataHora(hora);
                return (
                  <button
                    key={hora}
                    disabled={
                      !clickable &&
                      estado !== "pendiente" &&
                      estado !== "confirmada"
                    }
                    className={`btn-hora-admin ${estado}`}
                    onClick={() => clickable && toggleBloqueo(hora)}
                    style={{ "--i": index }}
                    title={label}
                  >
                    <span className="hora-label">{hora}</span>
                    <span className="estado-label">
                      {estado === "pendiente" || estado === "confirmada"
                        ? label
                        : ""}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {esAdmin && vista === "config" && (
        <div className="config-semanal">
          <div className="lista-dias">
            {DIAS_SEMANA.map((dia) => {
              const cfg = configSemanal[dia];
              return (
                <div
                  key={dia}
                  className={`fila-dia-card ${!cfg.abierto ? "cerrado" : ""}`}
                >
                  <div className="fila-header">
                    <strong className="capitalize">{dia}</strong>
                    <label className="switch-container">
                      <input
                        type="checkbox"
                        checked={cfg.abierto}
                        onChange={(e) =>
                          handleConfigChange(dia, "abierto", e.target.checked)
                        }
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {cfg.abierto && (
                    <div className="controles-row">
                      <div className="time-inputs">
                        <div className="input-group-time">
                          <small>Apertura</small>
                          <input
                            type="time"
                            value={cfg.apertura}
                            onChange={(e) =>
                              handleConfigChange(
                                dia,
                                "apertura",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="input-group-time">
                          <small>Cierre</small>
                          <input
                            type="time"
                            value={cfg.cierre}
                            onChange={(e) =>
                              handleConfigChange(dia, "cierre", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="almuerzo-section">
                        <label className="chk-almuerzo">
                          <input
                            type="checkbox"
                            checked={cfg.almuerzo.activo}
                            onChange={(e) =>
                              handleAlmuerzoChange(
                                dia,
                                "activo",
                                e.target.checked,
                              )
                            }
                          />
                          <span>Almuerzo / Descanso</span>
                        </label>
                        {cfg.almuerzo.activo && (
                          <div className="almuerzo-horas">
                            <input
                              type="time"
                              value={cfg.almuerzo.inicio}
                              onChange={(e) =>
                                handleAlmuerzoChange(
                                  dia,
                                  "inicio",
                                  e.target.value,
                                )
                              }
                            />
                            <span>a</span>
                            <input
                              type="time"
                              value={cfg.almuerzo.fin}
                              onChange={(e) =>
                                handleAlmuerzoChange(dia, "fin", e.target.value)
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={guardarConfiguracion} className="btn-save-global">
            Guardar Horarios del Negocio
          </button>
        </div>
      )}
    </section>
  );
};

export default Horarios;
