import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "./gestion.css";
const GestionCita = () => {
  const { idCita } = useParams();
  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerCita = async () => {
      const docRef = doc(db, "citas", idCita);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCita({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No existe la cita");
      }
      setCargando(false);
    };
    obtenerCita();
  }, [idCita]);

  const cancelarCita = async () => {
    if (window.confirm("¿Estás seguro de que deseas cancelar tu cita?")) {
      try {
        await updateDoc(doc(db, "citas", idCita), {
          estado: "cancelada",
        });
        alert("Cita cancelada con éxito.");
        // Refrescamos el estado local para que el botón desaparezca
        setCita({ ...cita, estado: "cancelada" });
      } catch (error) {
        alert("Error al cancelar.");
      }
    }
  };

  if (cargando) return <p>Cargando detalles de tu cita...</p>;
  if (!cita) return <p>Cita no encontrada o el enlace es inválido.</p>;

  return (
    <div className="gestion">
      <div className="tarjetaGestion">
        <h1>Detalles de tu Cita</h1>
        <p>
          <strong>Barbero:</strong> {cita.barberoNombre || "Cualquiera"}
        </p>
        <p>
          <strong>Fecha:</strong> {cita.fechaCita}
        </p>
        <p>
          <strong>Hora:</strong> {cita.horaCita}
        </p>
        <p>
          <strong>Estado:</strong>
          <span className={`badge ${cita.estado}`}>{cita.estado}</span>
        </p>

        {cita.estado !== "cancelada" && (
          <button onClick={cancelarCita} className="btn-cancelar-cliente">
            Cancelar Cita
          </button>
        )}
        <p className="nota">
          Si necesitas cambiar la hora, cancela esta y reserva una nueva.
        </p>
      </div>
    </div>
  );
};

export default GestionCita;
