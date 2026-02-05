import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import ListaServicios from "./ListaServicios";

const GestionServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState(null);

  // Estados de Interfaz
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarGestionCats, setMostrarGestionCats] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(null);
  const [nuevaCatNombre, setNuevaCatNombre] = useState("");
  const [hayMas, setHayMas] = useState(true);
  const [form, setForm] = useState({
    nombre: "",
    precio: "",
    duracion: "",
    categoriasIds: [],
    descripcion: "",
    profesionalesSeleccionados: [],
  });

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, "categorias"), (snap) => {
      setCategorias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const cargarProfesionales = async () => {
      const snap = await getDocs(collection(db, "profesionales"));
      setProfesionales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    cargarProfesionales();

    cargarServicios(true);
    return () => unsubCat();
  }, []);

  const cargarServicios = async (inicio = false) => {
    if (!inicio && (!hayMas || cargando)) return;

    setCargando(true);
    try {
      const coleccionRef = collection(db, "servicios");
      const limites = 10;
      let condiciones = [];

      if (filtroCategoria) {
        condiciones.push(
          where("categoriasIds", "array-contains", filtroCategoria),
        );
      }

      condiciones.push(orderBy("nombre", "asc"));

      let q;
      if (inicio) {
        q = query(coleccionRef, ...condiciones, limit(limites));
      } else {
        if (!ultimoDoc) {
          setCargando(false);
          return;
        }
        q = query(
          coleccionRef,
          ...condiciones,
          startAfter(ultimoDoc),
          limit(limites),
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        if (inicio) setServicios([]);
        setHayMas(false);
        setUltimoDoc(null);
      } else {
        const nuevosServicios = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHayMas(nuevosServicios.length === limites);
        setUltimoDoc(snapshot.docs[snapshot.docs.length - 1]);

        if (inicio) {
          setServicios(nuevosServicios);
        } else {
          setServicios((prev) => {
            const idsExistentes = new Set(prev.map((s) => s.id));
            const filtrados = nuevosServicios.filter(
              (s) => !idsExistentes.has(s.id),
            );
            return [...prev, ...filtrados];
          });
        }
      }
    } catch (error) {
      console.error("Error en Firestore:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setUltimoDoc(null);
    setHayMas(true);
    cargarServicios(true);
  }, [filtroCategoria]);

  const agregarCategoria = async () => {
    if (!nuevaCatNombre.trim()) return;
    await addDoc(collection(db, "categorias"), { nombre: nuevaCatNombre });
    setNuevaCatNombre("");
  };

  const editarCategoria = async (id, nombreActual) => {
    const nuevoNombre = prompt("Nuevo nombre para la categoría:", nombreActual);
    if (nuevoNombre && nuevoNombre !== nombreActual) {
      await updateDoc(doc(db, "categorias", id), { nombre: nuevoNombre });
    }
  };

  const eliminarCategoria = async (id) => {
    if (window.confirm("¿Eliminar categoría?")) {
      await deleteDoc(doc(db, "categorias", id));
    }
  };

  const toggleCategoria = (idCat) => {
    const actuales = form.categoriasIds;
    setForm({
      ...form,
      categoriasIds: actuales.includes(idCat)
        ? actuales.filter((id) => id !== idCat)
        : [...actuales, idCat],
    });
  };

  const guardarServicio = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio || form.categoriasIds.length === 0)
      return alert("Faltan campos");

    // CAMBIO AQUÍ: Creamos un objeto limpio para la DB usando el nombre 'profesionales'
    const dataPayload = {
      nombre: form.nombre,
      precio: Number(form.precio),
      duracion: Number(form.duracion),
      categoriasIds: form.categoriasIds,
      descripcion: form.descripcion,
      profesionales: form.profesionalesSeleccionados, // Se guarda como 'profesionales'
      updatedAt: new Date(),
    };

    try {
      if (modoEdicion) {
        await updateDoc(doc(db, "servicios", modoEdicion), dataPayload);
        setServicios((prev) =>
          prev.map((item) =>
            item.id === modoEdicion ? { ...item, ...dataPayload } : item,
          ),
        );
      } else {
        const docRef = await addDoc(collection(db, "servicios"), {
          ...dataPayload,
          createdAt: new Date(),
        });
        setServicios((prev) => [{ id: docRef.id, ...dataPayload }, ...prev]);
      }
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      precio: "",
      duracion: "",
      categoriasIds: [],
      descripcion: "",
      profesionalesSeleccionados: [],
    });
    setModoEdicion(null);
    setMostrarForm(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prepararEdicion = (servicio) => {
    setForm({
      ...servicio,
      // CAMBIO AQUÍ: Al editar, cargamos desde 'profesionales' al estado del formulario
      profesionalesSeleccionados: servicio.profesionales || [],
    });
    setModoEdicion(servicio.id);
    setMostrarForm(true);
    scrollToTop();
  };

  const toggleProfesional = (idProf) => {
    const current = form.profesionalesSeleccionados;
    setForm({
      ...form,
      profesionalesSeleccionados: current.includes(idProf)
        ? current.filter((id) => id !== idProf)
        : [...current, idProf],
    });
  };

  const eliminarServicio = async (id) => {
    if (window.confirm("¿Eliminar este servicio?")) {
      try {
        await deleteDoc(doc(db, "servicios", id));
        const nuevaLista = servicios.filter((s) => s.id !== id);
        setServicios(nuevaLista);
        if (nuevaLista.length === 0 && hayMas) {
          cargarServicios(true);
        }
      } catch (e) {
        console.error("Error al eliminar:", e);
      }
    }
  };

  return (
    <div className="servicios-container">
      <header className="headerServicios">
        <h1>Servicios</h1>
        <button
          onClick={() => {
            resetForm();
            setMostrarForm(!mostrarForm);
          }}
        >
          {mostrarForm ? "Cerrar" : "Agregar"}
        </button>
      </header>

      {mostrarForm && (
        <form onSubmit={guardarServicio} className="form-servicio">
          <input
            type="text"
            id="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <div className="precioMinutos">
            <input
              type="number"
              placeholder="Precio"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />
            <input
              type="number"
              placeholder="Minutos"
              value={form.duracion}
              onChange={(e) => setForm({ ...form, duracion: e.target.value })}
            />
          </div>
          <p className="nota">Si el servicio dura mas 30 min, usara 2 bloques.</p>
          <textarea
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="selector-categorias">
            <p>Categorías:</p>
            <div className="checkCats">
              {categorias.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={form.categoriasIds.includes(c.id)}
                    onChange={() => toggleCategoria(c.id)}
                  />{" "}
                  {c.nombre}
                </label>
              ))}
            </div>
          </div>

          <div className="selector-profesionales">
            <p>Profesionales:</p>
            <div className="checkPros">
              {profesionales.map((prof) => (
                <label key={prof.id}>
                  <input
                    type="checkbox"
                    checked={form.profesionalesSeleccionados.includes(prof.id)}
                    onChange={() => toggleProfesional(prof.id)}
                  />{" "}
                  {prof.nombre}
                </label>
              ))}
            </div>
          </div>
          <div className="boton-form">
            <button type="submit">
              {modoEdicion ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      )}

      {/* SECCIÓN CATEGORÍAS */}
      <div className="categorias">
        <header className="categorias-header">
          <h2>Categorías</h2>
          <button onClick={() => setMostrarGestionCats(!mostrarGestionCats)}>
            {mostrarGestionCats ? "Cerrar" : "Editar"}
          </button>
        </header>

        {mostrarGestionCats && (
          <div className="modal-gestion-cats">
            <div className="form-agregar-cat">
              <input
                type="text"
                placeholder="Nueva categoría..."
                value={nuevaCatNombre}
                onChange={(e) => setNuevaCatNombre(e.target.value)}
              />
              <button onClick={agregarCategoria}>Añadir</button>
            </div>
            <div className="lista-gestion-cats">
              {categorias.map((cat) => (
                <div className="catEdit" key={cat.id}>
                  <span>{cat.nombre}</span>
                  <div className="acciones-cat">
                    <button onClick={() => editarCategoria(cat.id, cat.nombre)}>
                      ✏️
                    </button>
                    <button onClick={() => eliminarCategoria(cat.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="carruselCategorias">
          <button
            onClick={() => setFiltroCategoria(null)}
            className={filtroCategoria === null ? "active" : ""}
          >
            Todo
          </button>
          {categorias.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={filtroCategoria === cat.id ? "active" : ""}
              style={{ "--i": index }}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="serviciosAdmin">
        <ListaServicios
          servicios={servicios}
          onEditar={prepararEdicion}
          onEliminar={eliminarServicio}
          esVistaCliente={false}
        />
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
          paddingBottom: "20px",
        }}
      >
        {cargando && <p>Cargando...</p>}
        {!cargando && hayMas && servicios.length > 0 && (
          <button onClick={() => cargarServicios(false)}>Cargar más</button>
        )}
        {!hayMas && servicios.length > 0 && (
          <p style={{ color: "#888", fontSize: "0.9rem" }}>
            No hay más servicios para mostrar
          </p>
        )}
      </div>
    </div>
  );
};

export default GestionServicios;
