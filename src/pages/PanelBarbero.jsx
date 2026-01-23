import { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
  setDoc,
} from "firebase/firestore";
import Horarios from "../components/Horarios";
import Citas from "../components/Citas";
import Barra from "../components/Barra";
import GestionServicios from "../components/GestionServicios";
import "./panelbarbero.css";
const VISTAS = {
  CITAS: "citas",
  HORARIO: "horario",
  SERVICIOS: "servicios",
};
const PanelBarbero = () => {
  const [activeVista, setActiveVista] = useState(VISTAS.CITAS);
  const hoy = new Date().toISOString().split("T")[0];
  const [citas, setCitas] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [fechaBloqueo, setFechaBloqueo] = useState(hoy);
  const [bloqueos, setBloqueos] = useState([]);

  const generarHorarios = (inicio, fin) => {
    const horarios = [];
    for (let hora = inicio; hora < fin; hora++) {
      horarios.push(`${hora}:00`, `${hora}:30`);
    }
    return horarios;
  };
  const HORARIOS_BASE = generarHorarios(11, 20);

  // 1. Obtener UID del barbero logueado
  const barberoId = auth.currentUser?.uid;

  // EFECTO CITAS: Filtrar por barberoId
  useEffect(() => {
    if (!barberoId) return;

    const q = query(
      collection(db, "citas"),
      where("barberoId", "==", barberoId), // FILTRO VITAL
      orderBy("fechaCita", "asc"),
    );

    return onSnapshot(q, (snapshot) => {
      setCitas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [barberoId]);

  // EFECTO BLOQUEOS: Filtrar por barberoId y fecha
  useEffect(() => {
    if (!barberoId) return;

    const q = query(
      collection(db, "bloqueos"),
      where("fecha", "==", fechaBloqueo),
      where("barberoId", "==", barberoId), // FILTRO VITAL
    );

    return onSnapshot(q, (snapshot) => {
      setBloqueos(snapshot.docs.map((doc) => doc.data().hora));
    });
  }, [fechaBloqueo, barberoId]);

  // TOGGLE BLOQUEO: Guardar con el ID del barbero
  const toggleBloqueo = async (hora) => {
    // El ID del documento de bloqueo ahora incluye el barberoId para que sea único por persona
    const idBloqueo = `${barberoId}_${fechaBloqueo}_${hora.replace(":", "")}`;
    const docRef = doc(db, "bloqueos", idBloqueo);

    try {
      if (bloqueos.includes(hora)) {
        await deleteDoc(docRef);
      } else {
        // Al crear el bloqueo, guardamos el barberoId
        await setDoc(docRef, {
          fecha: fechaBloqueo,
          hora: hora,
          barberoId: barberoId,
        });
      }
    } catch (error) {
      console.error("Error en toggleBloqueo:", error);
    }
  };

  const borrarCita = async (id) => {
    if (window.confirm("¿Eliminar cita?"))
      await deleteDoc(doc(db, "citas", id));
  };

  const gestionarCita = async (cita, nuevoEstado) => {
    // 1. Definimos los mensajes
    const mensajes = {
      confirmada: `Hola ${cita.clienteNombre}, te confirmo tu cita para el día ${cita.fechaCita} a las ${cita.horaCita}. ¡Te esperamos!`,
      cancelada: `Hola ${cita.clienteNombre}, lamentamos informarte que hemos tenido que cancelar tu cita para el ${cita.fechaCita}. Por favor, reserva otro horario en nuestra web.`,
      contacto: `Hola ${cita.clienteNombre}, te contacto desde la Barbería para realizarte una consulta sobre tu cita del día ${cita.fechaCita}.`,
    };

    // 2. Preparamos el texto
    const texto = encodeURIComponent(
      mensajes[nuevoEstado] || mensajes.contacto,
    );

    // 3. Abrimos WhatsApp usando el teléfono que ya viene limpio de la DB
    window.location.href = `https://wa.me/${cita.clienteTelefono}?text=${texto}`;

    // 4. Actualizamos Firebase (solo si cambia el estado)
    if (nuevoEstado !== "contacto") {
      try {
        await updateDoc(doc(db, "citas", cita.id), { estado: nuevoEstado });
      } catch (error) {
        console.error("Error al actualizar estado:", error);
      }
    }

    setMenuAbierto(null);
  };

  const renderActiveView = () => {
    switch (activeVista) {
      case VISTAS.CITAS:
        return (
          <Citas
            citas={citas}
            menuAbierto={menuAbierto}
            setMenuAbierto={setMenuAbierto}
            borrarCita={borrarCita}
            gestionarCita={gestionarCita}
          />
        );
      case VISTAS.HORARIO:
        return (
          <Horarios
            fechaBloqueo={fechaBloqueo}
            setFechaBloqueo={setFechaBloqueo}
            horariosBase={HORARIOS_BASE}
            bloqueos={bloqueos}
            toggleBloqueo={toggleBloqueo}
            citas={citas}
          />
        );
      case VISTAS.SERVICIOS:
        return <GestionServicios />;
      default:
        <Citas
          citas={citas}
          menuAbierto={menuAbierto}
          setMenuAbierto={setMenuAbierto}
          borrarCita={borrarCita}
          gestionarCita={gestionarCita}
        />;
    }
  };

  return (
    <>
      <Barra
        onVistaChange={setActiveVista}
        activeVista={activeVista}
        vistas={VISTAS}
      ></Barra>
      <div className="panel">{renderActiveView()}</div>
    </>
  );
};

export default PanelBarbero;
