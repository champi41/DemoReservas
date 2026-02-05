import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Agregué useNavigate por si quieres redirigir
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "./gestion.css";

const GestionCita = () => {
  const { idCita } = useParams();
  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Formateador de fecha para que se vea elegante
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr + "T00:00:00"); // Truco para evitar desfase de zona horaria
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(fecha);
  };

  useEffect(() => {
    const obtenerCita = async () => {
      try {
        const docRef = doc(db, "citas", idCita);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCita({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No existe la cita");
        }
      } catch (error) {
        console.error("Error obteniendo cita:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerCita();
  }, [idCita]);

  const cancelarCita = async () => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas cancelar tu cita? Esta acción no se puede deshacer.",
      )
    ) {
      try {
        await updateDoc(doc(db, "citas", idCita), {
          estado: "cancelada",
        });
        alert("Cita cancelada con éxito.");
        setCita({ ...cita, estado: "cancelada" });
      } catch (error) {
        console.error(error);
        alert("Error al cancelar. Inténtalo de nuevo.");
      }
    }
  };

  if (cargando) return <div className="loading">Cargando detalles...</div>;
  if (!cita)
    return (
      <div className="error-msg">Cita no encontrada o enlace inválido.</div>
    );

  return (
    <div className="gestion-container">
      <div className="tarjetaGestion">
        <header className={`header-estado ${cita.estado}`}>
          <h1>{cita.estado.toUpperCase()}</h1>
        </header>

        <div className="cuerpo-tarjeta">
          <div className="dato-fila">
            <label>Servicio:</label>
            <p>{cita.servicioNombre}</p>
          </div>

          <div className="dato-fila">
            <label>Profesional:</label>
            {/* Usamos barberoNombre porque así lo guardamos en el formulario */}
            <p>
              {cita.barberoNombre || cita.profesionalNombre || "No asignado"}
            </p>
          </div>

          <div className="dato-fila">
            <label>Fecha:</label>
            <p className="resalte">{formatearFecha(cita.fechaCita)}</p>
          </div>

          <div className="dato-fila">
            <label>Hora:</label>
            <p className="resalte">{cita.horaCita} hrs</p>
          </div>

          <div className="dato-fila">
            <label>Cliente:</label>
            <p>{cita.clienteNombre}</p>
          </div>

          <hr />

          {cita.estado !== "cancelada" && (
            <button onClick={cancelarCita} className="btn-cancelar-cliente">
              Cancelar Reserva
            </button>
          )}

          <p className="nota-pie">
            ID de reserva: <small>{cita.id}</small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GestionCita;
