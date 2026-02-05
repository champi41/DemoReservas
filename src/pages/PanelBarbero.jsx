import { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  doc,
  getDoc,
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

  // ESTADO EXCLUSIVO PARA LA AGENDA (HORARIOS)
  const [citasAgenda, setCitasAgenda] = useState([]);
  const [fechaBloqueo, setFechaBloqueo] = useState(hoy); // Fecha del calendario visual
  const [bloqueos, setBloqueos] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(null);

  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [horariosBase, setHorariosBase] = useState([]);

  const profesionalId = auth.currentUser?.uid;
  const esAdmin = perfilUsuario?.rol === "admin";
  
  // 1. CARGAR PERFIL
  useEffect(() => {
    if (!profesionalId) return;
    const obtenerPerfilYConfig = async () => {
      try {
        const docRef = doc(db, "profesionales", profesionalId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const datos = docSnap.data();
          setPerfilUsuario(datos);
          let apertura = datos.configuracion?.apertura || 11;
          let cierre = datos.configuracion?.cierre || 20;
          const horas = [];
          for (let i = apertura; i < cierre; i++) {
            horas.push(`${i}:00`, `${i}:30`);
          }
          setHorariosBase(horas);
        }
      } catch (error) {
        console.error("Error perfil:", error);
      } finally {
        setCargandoPerfil(false);
      }
    };
    obtenerPerfilYConfig();
  }, [profesionalId]);

  // 2. LISTENER EXCLUSIVO PARA LA AGENDA (Optimizado)
  // Solo escucha cambios en la fecha que el barbero está mirando en el calendario
  useEffect(() => {
    if (!profesionalId) return;

    const q = query(
      collection(db, "citas"),
      where("barberoId", "==", profesionalId),
      where("fechaCita", "==", fechaBloqueo),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setCitasAgenda(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });
    return () => unsub();
  }, [profesionalId, fechaBloqueo]);

  // 3. LISTENER BLOQUEOS (Igual)
  useEffect(() => {
    if (!profesionalId) return;
    const q = query(
      collection(db, "bloqueos"),
      where("fecha", "==", fechaBloqueo),
      where("barberoId", "==", profesionalId),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setBloqueos(snapshot.docs.map((doc) => doc.data().hora));
    });
    return () => unsub();
  }, [fechaBloqueo, profesionalId]);

  // --- FUNCIONES COMPARTIDAS ---
  const toggleBloqueo = async (hora) => {
    const idBloqueo = `${profesionalId}_${fechaBloqueo}_${hora.replace(":", "")}`;
    const docRef = doc(db, "bloqueos", idBloqueo);
    try {
      if (bloqueos.includes(hora)) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          fecha: fechaBloqueo,
          hora: hora,
          barberoId: profesionalId,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const borrarCita = async (id) => {
    if (window.confirm("¿Eliminar cita?")) {
      await deleteDoc(doc(db, "citas", id));
    }
  };

  const gestionarCita = async (cita, nuevoEstado) => {
    const mensajes = {
      confirmada: `Hola ${cita.clienteNombre}, confirmo tu cita...`,
      cancelada: `Hola ${cita.clienteNombre}, cancelamos tu cita...`,
      contacto: `Hola ${cita.clienteNombre}, te contacto por tu cita...`,
    };
    if (["contacto", "confirmada", "cancelada"].includes(nuevoEstado)) {
      window.location.href = `https://wa.me/${cita.clienteTelefono}?text=${encodeURIComponent(mensajes[nuevoEstado])}`;
    }
    if (nuevoEstado !== "contacto") {
      await updateDoc(doc(db, "citas", cita.id), { estado: nuevoEstado });
    }
    setMenuAbierto(null);
  };

  const renderActiveView = () => {
    switch (activeVista) {
      case VISTAS.CITAS:
        return (
          <Citas
            menuAbierto={menuAbierto}
            setMenuAbierto={setMenuAbierto}
            borrarCita={borrarCita}
            gestionarCita={gestionarCita}
          />
        );
      case VISTAS.HORARIO:
        return (
          <Horarios
            usuarioLogueado={perfilUsuario}
            fechaBloqueo={fechaBloqueo}
            setFechaBloqueo={setFechaBloqueo}
            horariosBase={horariosBase}
            bloqueos={bloqueos}
            toggleBloqueo={toggleBloqueo}
            citas={citasAgenda} // Solo recibe las citas de la fecha seleccionada
          />
        );
      case VISTAS.SERVICIOS:
        return esAdmin ? (
          <GestionServicios />
        ) : (
          <Citas
            menuAbierto={menuAbierto}
            setMenuAbierto={setMenuAbierto}
            borrarCita={borrarCita}
            gestionarCita={gestionarCita}
          />
        );
      default:
        return null;
    }
  };

  if (cargandoPerfil)
    return <div className="loading">Verificando acceso...</div>;

  return (
    <div className="panel-container">
      <Barra
        onVistaChange={setActiveVista}
        activeVista={activeVista}
        vistas={VISTAS}
        rol={perfilUsuario?.rol}
      />
      {renderActiveView()}
    </div>
  );
};

export default PanelBarbero;
