import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDoc,
  doc,
  addDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

const hoy = new Date().toISOString().split("T")[0];
const fechaMaximaObj = new Date();
fechaMaximaObj.setDate(fechaMaximaObj.getDate() + 30);
const max = fechaMaximaObj.toISOString().split("T")[0];

const FormularioReserva = ({
  servicioSeleccionado,
  setServicioSeleccionado,
  barberoSeleccionado, // Recibimos el barbero elegido
}) => {
  const [fecha, setFecha] = useState(hoy);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [config, setConfig] = useState({ apertura: 11, cierre: 20 });
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  // 1. Obtener configuración (Podríamos usar la del barbero si la tuviera personalizada)
  useEffect(() => {
    const obtenerConfig = async () => {
      // Intentamos traer la config específica del barbero, si no, la global
      const docRef = doc(db, "barberos", barberoSeleccionado.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().configuracion) {
        setConfig({
          apertura: docSnap.data().configuracion.apertura,
          cierre: docSnap.data().configuracion.cierre,
        });
      } else {
        // Fallback a config global si el barbero no tiene una propia
        const globalRef = doc(db, "configuracion", "barberia_1");
        const globalSnap = await getDoc(globalRef);
        if (globalSnap.exists()) {
          setConfig({
            apertura: globalSnap.data().horaApertura,
            cierre: globalSnap.data().horaCierre,
          });
        }
      }
    };
    obtenerConfig();
  }, [barberoSeleccionado]);

  // 2. Consultar disponibilidad FILTRADA POR BARBERO
  useEffect(() => {
    if (!fecha || !barberoSeleccionado) {
      setHorasOcupadas([]);
      return;
    }

    // Filtramos citas por fecha Y por barbero
    const qCitas = query(
      collection(db, "citas"),
      where("fechaCita", "==", fecha),
      where("barberoId", "==", barberoSeleccionado.id), // Filtro clave
      where("estado", "!=", "cancelada"),
    );

    // Filtramos bloqueos por fecha Y por barbero
    const qBloqueos = query(
      collection(db, "bloqueos"),
      where("fecha", "==", fecha),
      where("barberoId", "==", barberoSeleccionado.id), // Filtro clave
    );

    let ocupadasCitas = [];
    let ocupadasBloqueos = [];

    const combinarYSetear = () => {
      setHorasOcupadas([...new Set([...ocupadasCitas, ...ocupadasBloqueos])]);
    };

    const unsubCitas = onSnapshot(qCitas, (snapshot) => {
      ocupadasCitas = snapshot.docs.map((doc) => doc.data().horaCita);
      combinarYSetear();
    });

    const unsubBloqueos = onSnapshot(qBloqueos, (snapshot) => {
      ocupadasBloqueos = snapshot.docs.map((doc) => doc.data().hora);
      combinarYSetear();
    });

    setHoraSeleccionada("");

    return () => {
      unsubCitas();
      unsubBloqueos();
    };
  }, [fecha, barberoSeleccionado]);

  const manejarCambioFecha = (e) => {
    const fechaElegida = e.target.value;
    if (!fechaElegida) return;
    if (fechaElegida < hoy) {
      alert("No puedes seleccionar una fecha pasada.");
      setFecha(hoy);
      return;
    }
    if (fechaElegida > max) {
      alert("Solo puedes reservar con un máximo de 30 días de anticipación.");
      setFecha(max);
      return;
    }
    setFecha(fechaElegida);
  };

  const generarHorarios = (inicio, fin) => {
    const horarios = [];
    for (let hora = inicio; hora < fin; hora++) {
      horarios.push(`${hora}:00`);
      horarios.push(`${hora}:30`);
    }
    return horarios;
  };

  const HORARIOS_TOTALES = generarHorarios(config.apertura, config.cierre);

  const horasDisponibles = HORARIOS_TOTALES.filter((hora) => {
    const estaOcupada = horasOcupadas.includes(hora);
    if (estaOcupada) return false;

    if (fecha === hoy) {
      const [h, m] = hora.split(":").map(Number);
      const ahora = new Date();
      const horaDelTurno = new Date();
      horaDelTurno.setHours(h, m, 0, 0);
      return horaDelTurno > ahora;
    }
    return true;
  });

  const manejarReserva = async (e) => {
    e.preventDefault();

    const telefonoLimpio = telefono.replace(/\D/g, "");
    if (telefonoLimpio.length < 8) return alert("Teléfono inválido.");
    if (!horaSeleccionada) return alert("Por favor elige una hora");

    if (horasOcupadas.includes(horaSeleccionada)) {
      alert("¡Lo sentimos! Esta hora acaba de ser ocupada.");
      setHoraSeleccionada("");
      return;
    }

    try {
      // CORRECCIÓN AQUÍ: Agregamos "const docRef ="
      const docRef = await addDoc(collection(db, "citas"), {
        clienteNombre: nombre,
        clienteTelefono: telefonoLimpio,
        clienteCorreo: correo,
        servicioId: servicioSeleccionado.id,
        servicioNombre: servicioSeleccionado.nombre,
        precioServicio: servicioSeleccionado.precio,
        duracionServicio: servicioSeleccionado.duracion,
        barberoId: barberoSeleccionado.id,
        barberoNombre: barberoSeleccionado.nombre,
        fechaCita: fecha,
        horaCita: horaSeleccionada,
        estado: "pendiente",
        creadoEn: serverTimestamp(),
      });

      // Ahora docRef.id sí funcionará
      const urlGestion = `${window.location.origin}/mi-cita/${docRef.id}`;

      alert(`¡Reserva realizada con éxito!`);

      // La redirección ocurre después de que el usuario acepta el alert
      window.location.href = urlGestion;

      setServicioSeleccionado(null);
    } catch (error) {
      console.error("Error al reservar: ", error);
      alert("Hubo un error al procesar tu reserva.");
    }
  };

  return (
    <div className="modal">
      <h2>Reservar {servicioSeleccionado.nombre}</h2>
      <p className="pro-tag">
        Profesional: <strong>{barberoSeleccionado.nombre}</strong>
      </p>
      <p className="precio-tag">
        Valor: ${servicioSeleccionado.precio} | {servicioSeleccionado.duracion}{" "}
        min
      </p>

      <form onSubmit={manejarReserva} className="form">
        {/* ... Resto del formulario igual que antes ... */}
        <div className="datosForm">
          <label>Nombre</label>
          <input
            required
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div className="datosForm">
          <label>Teléfono</label>
          <input
            required
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 9 1234 5678"
          />
        </div>

        <div className="datosForm">
          <label>Correo</label>
          <input
            required
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="Ej: juanperez@email.com"
          />
        </div>

        <div className="datosForm">
          <label>Día</label>
          <input
            required
            type="date"
            value={fecha}
            min={hoy}
            max={max}
            onChange={manejarCambioFecha}
            onBlur={manejarCambioFecha}
          />
        </div>

        <div className="datosForm">
          <label>Hora</label>
          <div
            className="listaHoras"
            data-estado={
              !fecha || horasDisponibles.length <= 0 ? "nada" : "disponible"
            }
          >
            {!fecha ? (
              <p>Selecciona una fecha primero</p>
            ) : horasDisponibles.length === 0 ? (
              <p>
                No hay horas disponibles en esta fecha para{" "}
                {barberoSeleccionado.nombre}. Selecciona otra fecha u otro
                profesional.
              </p>
            ) : (
              horasDisponibles.map((hora) => (
                <button
                  type="button"
                  key={hora}
                  className={horaSeleccionada === hora ? "seleccionada" : ""}
                  onClick={() => setHoraSeleccionada(hora)}
                >
                  {hora}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="btnsForm">
          <button
            type="button"
            onClick={() => setServicioSeleccionado(null)}
            id="cancelarCita"
          >
            Cancelar
          </button>
          <button
            type="submit"
            id="confirmarCita"
            disabled={
              !horaSeleccionada || horasOcupadas.includes(horaSeleccionada)
            }
          >
            Confirmar Cita
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioReserva;
