import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
} from "firebase/firestore";
import ListaServicios from "../components/ListaServicios";
import FormularioReserva from "../components/FormularioReserva";
import SeleccionBarbero from "../components/SeleccionBarbero";

export const VistaCliente = () => {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [hayMas, setHayMas] = useState(true); // Nuevo: Para controlar el botón

  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);

  // 1. Cargar categorías al inicio
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const snap = await getDocs(collection(db, "categorias"));
        setCategorias(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error categorías:", e);
      }
    };
    cargarCategorias();
  }, []);

  // 2. Reset de paginación al cambiar categoría
  useEffect(() => {
    setUltimoDoc(null);
    setHayMas(true);
    fetchServicios(true);
  }, [categoriaActiva]);

  const fetchServicios = async (nuevaBusqueda = false) => {
    if (cargando || (!nuevaBusqueda && !hayMas)) return;

    setCargando(true);
    try {
      const serviciosRef = collection(db, "servicios");
      const limiteDocs = 10;
      let condiciones = [];

      // FILTRO: Siempre el 'where' antes del 'orderBy' si es el mismo campo,
      // pero aquí como son distintos, el orden importa para el índice.
      if (categoriaActiva !== "Todas") {
        condiciones.push(
          where("categoriasIds", "array-contains", categoriaActiva),
        );
      }

      condiciones.push(orderBy("nombre", "asc"));

      let q;
      if (nuevaBusqueda || !ultimoDoc) {
        q = query(serviciosRef, ...condiciones, limit(limiteDocs));
      } else {
        q = query(
          serviciosRef,
          ...condiciones,
          startAfter(ultimoDoc),
          limit(limiteDocs),
        );
      }

      const snap = await getDocs(q);
      const nuevos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Determinar si hay más páginas
      setHayMas(nuevos.length === limiteDocs);
      setUltimoDoc(snap.docs[snap.docs.length - 1] || null);

      setServicios((prev) => (nuevaBusqueda ? nuevos : [...prev, ...nuevos]));
    } catch (error) {
      console.error("Error al obtener servicios:", error);
    } finally {
      setCargando(false);
    }
  };
  // PANTALLA A: Lista de Servicios
  const renderListaServicios = () => (
    <>
      {/* Carrusel de Categorías */}
      <div className="filtros-categorias-container">
        <div className="carruselCategorias">
          <button
            className={categoriaActiva === "Todas" ? "active" : ""}
            onClick={() => setCategoriaActiva("Todas")}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              className={categoriaActiva === cat.id ? "active" : ""}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>
      <main>
        <ListaServicios
          servicios={servicios}
          esVistaCliente={true}
          // Al ser vista cliente, "onEditar" se convierte en "Seleccionar"
          onEditar={(s) => setServicioSeleccionado(s)}
          onEliminar={() => {}}
        />

        {cargando && <p className="txt-cargando">Cargando servicios...</p>}

        {!cargando && hayMas && servicios.length > 0 && (
          <div className="container-load-more">
            <button
              className="btn-cargar-mas"
              onClick={() => fetchServicios(false)}
            >
              Cargar más
            </button>
          </div>
        )}
      </main>
    </>
  );

  // PANTALLA B: Selector de Profesional
  const renderSelectorBarbero = () => (
    <SeleccionBarbero
      servicioSeleccionado={servicioSeleccionado}
      soloIds={servicioSeleccionado.profesionales || []}
      alSeleccionar={setBarberoSeleccionado}
      alCancelar={() => setServicioSeleccionado(null)}
    />
  );

  // PANTALLA C: Formulario Final
  const renderFormulario = () => (
    <FormularioReserva
      servicioSeleccionado={servicioSeleccionado}
      barberoSeleccionado={barberoSeleccionado}
      setServicioSeleccionado={() => {
        setServicioSeleccionado(null);
        setBarberoSeleccionado(null);
      }}
    />
  );

  return (
    <div className="vistaCliente">
      <header className="headerMain">
        <h1>Reserva tu Cita</h1>
      </header>

      {/* Lógica de Navegación "Falsa" */}
      {!servicioSeleccionado
        ? renderListaServicios()
        : !barberoSeleccionado
          ? renderSelectorBarbero()
          : renderFormulario()}
    </div>
  );
};
