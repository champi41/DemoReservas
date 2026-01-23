import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const SeleccionBarbero = ({ alSeleccionar, alCancelar }) => {
  const [barberos, setBarberos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerBarberos = async () => {
      try {
        // Solo traemos barberos que estén activos
        const q = query(
          collection(db, "barberos"),
          where("estado", "==", "activo")
        );
        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBarberos(lista);
      } catch (error) {
        console.error("Error al traer barberos:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerBarberos();
  }, []);

  if (cargando) return <div className="modal">Cargando profesionales...</div>;

  return (
    <div className="modal">
      <div className="selectorBarbero">
        <h2>Seleccionar profesional</h2>

        <div className="listaProfesionales">
          {/* OPCIÓN: CUALQUIERA (Lógica especial) */}
          <div className="profesional">
            <div className="infoPro">
              <h2>Cualquier profesional</h2>
              <p>Te asignaremos el que tenga disponibilidad</p>
            </div>
            <button
              onClick={() =>
                alSeleccionar({ id: "cualquiera", nombre: "Cualquiera" })
              }
            >
              Seleccionar
            </button>
          </div>

          {/* LISTA DE BARBEROS REALES */}
          {barberos.map((barbero) => (
            <div key={barbero.id} className="profesional">
              <div className="infoPro">
                <h2>{barbero.nombre}</h2>
                {/* Aquí podrías poner una descripción o foto después */}
              </div>
              <button onClick={() => alSeleccionar(barbero)}>
                Seleccionar
              </button>
            </div>
          ))}
        </div>

        <button className="btn-volver" onClick={alCancelar}>
          Volver a servicios
        </button>
      </div>
    </div>
  );
};

export default SeleccionBarbero;
