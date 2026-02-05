import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  documentId,
  onSnapshot,
  doc,
} from "firebase/firestore";

// --- FUNCIONES DE APOYO (Matemática de tiempo) ---
const horaAMinutos = (horaStr) => {
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + m;
};

const minutosAHora = (minutos) => {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const SeleccionBarbero = ({
  soloIds,
  servicioSeleccionado,
  alSeleccionar,
  alCancelar,
}) => {
  // --- ESTADOS ---
  const [listaProfesionales, setListaProfesionales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paso, setPaso] = useState(1); // 1: Elegir Pro, 2: Elegir Fecha/Hora
  const [proElegido, setProElegido] = useState(null);

  // --- CONFIGURACIÓN DE FECHAS ---
  const obtenerFechaLocal = (fechaObj) => {
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const day = String(fechaObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const hoy = obtenerFechaLocal(new Date());
  const [fecha, setFecha] = useState(hoy);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [bloquesOcupados, setBloquesOcupados] = useState([]); // Horas que no se pueden usar
  const [configSemanal, setConfigSemanal] = useState(null);
  const [cargandoHoras, setCargandoHoras] = useState(false);

  // Duración del servicio que viene del componente padre
  const duracionNecesaria = servicioSeleccionado?.duracion || 30;

  // --- 1. CARGAR PROFESIONALES ---
  useEffect(() => {
    const obtenerProfesionales = async () => {
      try {
        if (!soloIds || soloIds.length === 0) {
          setCargando(false);
          return;
        }
        const q = query(
          collection(db, "profesionales"),
          where(documentId(), "in", soloIds),
        );
        const snapshot = await getDocs(q);
        const lista = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.activo === true);
        setListaProfesionales(lista);
      } catch (error) {
        console.error("Error profesionales:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerProfesionales();
  }, [soloIds]);

  // --- 2. LOGICA DE HORARIOS Y DISPONIBILIDAD (CORREGIDA) ---
  useEffect(() => {
    if (!proElegido || !fecha) return;
    setCargandoHoras(true);

    // 1. Cargar Configuración (Una sola vez por cambio de pro/fecha)
    const cargarConfig = async () => {
      const docRef = doc(db, "configuracion", "barberia_1");
      const snap = await getDoc(docRef);
      if (snap.exists()) setConfigSemanal(snap.data().horarioSemanal);
    };
    cargarConfig();

    // 2. Listeners Independientes
    const qCitas = query(
      collection(db, "citas"),
      where("barberoId", "==", proElegido.id),
      where("fechaCita", "==", fecha),
      where("estado", "!=", "cancelada"),
    );

    const qBloqueos = query(
      collection(db, "bloqueos"),
      where("barberoId", "==", proElegido.id),
      where("fecha", "==", fecha),
    );

    let datosCitas = [];
    let datosBloqueos = [];

    const actualizarEstadoFinal = () => {
      const ocupados = new Set();

      // Procesar Citas
      datosCitas.forEach((cita) => {
        const inicio = horaAMinutos(cita.horaCita);
        const duracion = cita.duracionServicio || 30;
        for (let i = 0; i < duracion; i += 30) {
          ocupados.add(minutosAHora(inicio + i));
        }
      });

      // Procesar Bloqueos
      datosBloqueos.forEach((hora) => ocupados.add(hora));

      setBloquesOcupados(Array.from(ocupados));
      setCargandoHoras(false);
    };

    // Suscripción a Citas
    const unsubCitas = onSnapshot(qCitas, (snap) => {
      datosCitas = snap.docs.map((d) => d.data());
      actualizarEstadoFinal();
    });

    // Suscripción a Bloqueos (Ahora sí detectará cuando borres uno)
    const unsubBloqueos = onSnapshot(qBloqueos, (snap) => {
      datosBloqueos = snap.docs.map((d) => d.data().hora);
      actualizarEstadoFinal();
    });

    // Limpiar AMBOS listeners al desmontar o cambiar filtros
    return () => {
      unsubCitas();
      unsubBloqueos();
    };
  }, [proElegido, fecha]);

  // --- HELPERS DE RENDERIZADO ---
  const obtenerNombreDia = (fechaStr) => {
    const mapDias = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const date = new Date(fechaStr + "T12:00:00");
    return mapDias[date.getDay()];
  };

  const generarHorariosBase = () => {
    if (!configSemanal) return [];
    const nombreDia = obtenerNombreDia(fecha);
    const configDia = configSemanal[nombreDia];
    if (!configDia || !configDia.abierto) return [];

    const slots = [];
    const inicioMin = horaAMinutos(configDia.apertura);
    const finMin = horaAMinutos(configDia.cierre);

    let actual = inicioMin;
    while (actual < finMin) {
      const horaStr = minutosAHora(actual);
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
      actual += 30;
    }
    return slots;
  };

  const calcularDisponibles = () => {
    const todosLosSlots = generarHorariosBase();
    const ahora = new Date();

    return todosLosSlots.filter((hora) => {
      const inicioNuevo = horaAMinutos(hora);

      // Validar si caben todos los bloques de 30min que requiere el servicio
      for (let i = 0; i < duracionNecesaria; i += 30) {
        const bloqueEvaluar = minutosAHora(inicioNuevo + i);
        // Si el bloque está ocupado O no existe en el horario del local, no es válida
        if (
          bloquesOcupados.includes(bloqueEvaluar) ||
          !todosLosSlots.includes(bloqueEvaluar)
        ) {
          return false;
        }
      }

      // Validación de tiempo real
      const fechaTurno = new Date(`${fecha}T${hora}:00`);
      return fechaTurno > ahora;
    });
  };

  const handleConfirmar = () => {
    if (!proElegido || !fecha || !horaSeleccionada) return;
    alSeleccionar({
      ...proElegido,
      fechaReserva: fecha,
      horaReserva: horaSeleccionada,
    });
  };

  if (cargando) return <div className="loading">Cargando profesionales...</div>;

  return (
    <div className="selecPro">
      {paso === 1 ? (
        <>
          <div className="header-step">
            <h2>Selecciona un Profesional</h2>
            <p>
              Servicio: {servicioSeleccionado?.nombre} ({duracionNecesaria} min)
            </p>
          </div>
          <div className="grid-profesionales">
            {listaProfesionales.map((pro, index) => (
              <div key={pro.id} className="card-pro" style={{ "--i": index }}>
                <h3>{pro.nombre}</h3>
                <button
                  className="btn-elegir"
                  onClick={() => {
                    setProElegido(pro);
                    setPaso(2);
                  }}
                >
                  Ver Disponibilidad
                </button>
              </div>
            ))}
          </div>
          <div className="btn-volver">
            <button className="btn-texto" onClick={alCancelar}>
              Volver
            </button>
          </div>
        </>
      ) : (
        <div className="selector-fecha-hora">
          <header className="header-agenda">
            <h2>Agenda de {proElegido.nombre}</h2>
          </header>
          <div className="input-group">
            <label>Fecha:</label>
            <input
              type="date"
              value={fecha}
              min={hoy}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="gridHoras-container">
            {cargandoHoras ? (
              <div className="spinner">Cargando...</div>
            ) : calcularDisponibles().length === 0 ? (
              <p className="txt-vacio">
                No hay turnos disponibles para esta duración.
              </p>
            ) : (
              <div className="gridHoras">
                {calcularDisponibles().map((hora, index) => (
                  <button
                    key={hora}
                    className={
                      horaSeleccionada === hora ? "hora-selected" : "hora-btn"
                    }
                    onClick={() => setHoraSeleccionada(hora)}
                    style={{ "--i": index }}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="actions">
            <button
              className="btn-back-icon"
              onClick={() => {
                setPaso(1);
                setHoraSeleccionada("");
              }}
            >
              Volver
            </button>
            <button
              className="btn-primary full-width"
              disabled={!horaSeleccionada}
              onClick={handleConfirmar}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeleccionBarbero;
