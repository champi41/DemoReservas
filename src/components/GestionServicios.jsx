import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import ListaServicios from "./ListaServicios";
const GestionServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: "",
    precio: "",
    duracion: "",
  });

  useEffect(() => {
    // Ordenamos por nombre para que la lista sea fácil de leer
    const q = query(collection(db, "servicios"), orderBy("nombre", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setServicios(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const [mostrar, setMostrar] = useState(false);
  const alternarDiv = () => {
    setMostrar(!mostrar);
  };

  const agregarServicio = async (e) => {
    e.preventDefault();
    const { nombre, precio, duracion } = nuevoServicio;

    if (!nombre || !precio || !duracion) {
      alert("Por favor rellena todos los campos");
      return;
    }

    try {
      await addDoc(collection(db, "servicios"), {
        nombre: nombre,
        precio: Number(precio),
        duracion: Number(duracion), // Guardamos como número para cálculos futuros
        createdAt: new Date(),
      });
      // Limpiar formulario
      setNuevoServicio({ nombre: "", precio: "", duracion: "" });
    } catch (error) {
      console.error("Error al agregar servicio:", error);
    }
  };

  const eliminarServicio = async (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este servicio?")) {
      await deleteDoc(doc(db, "servicios", id));
    }
  };

  return (
    <div className="servicios">
      <header className="headerServicios">
        <h1>Servicios</h1>
        {mostrar ? (
          <button className="btnAgregarActive" onClick={alternarDiv}>X</button>
        ) : (
          <button onClick={alternarDiv}>Agregar</button>
        )}
      </header>
      {/* Formulario de Entrada */}
      {mostrar && (
        <form onSubmit={agregarServicio}>
          <div>
            <label>Servicio</label>
            <input
              type="text"
              placeholder="Ej: Corte Premium"
              value={nuevoServicio.nombre}
              onChange={(e) =>
                setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })
              }
            />
          </div>
          <div>
            <label>Precio ($)</label>
            <input
              type="number"
              placeholder="0"
              value={nuevoServicio.precio}
              onChange={(e) =>
                setNuevoServicio({ ...nuevoServicio, precio: e.target.value })
              }
            />
          </div>
          <div>
            <label>Minutos</label>
            <input
              type="number"
              placeholder="30"
              value={nuevoServicio.duracion}
              onChange={(e) =>
                setNuevoServicio({
                  ...nuevoServicio,
                  duracion: e.target.value,
                })
              }
            />
          </div>
          <div className="divBtnAgregar">
            <button type="submit">Añadir</button>
          </div>
        </form>
      )}

      {/* Tabla de Servicios */}
      <ListaServicios
        alSeleccionar={eliminarServicio}
        accion={"Eliminar"}
      ></ListaServicios>
    </div>
  );
};

export default GestionServicios;
