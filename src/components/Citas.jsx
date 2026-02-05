import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  onSnapshot,
} from "firebase/firestore";

const Citas = ({ menuAbierto, setMenuAbierto, borrarCita, gestionarCita }) => {
  const [filtroTiempo, setFiltroTiempo] = useState("hoy");
  const [citasVisualizadas, setCitasVisualizadas] = useState([]); // Array unificado
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(false);

  // Estados visuales (filtros de estado)
  const [estadosActivos, setEstadosActivos] = useState([
    "pendiente",
    "confirmada",
    "cancelada",
    "finalizada",
  ]);

  const profesionalId = auth.currentUser?.uid;
  const hoyReal = new Date().toISOString().split("T")[0]; // Siempre es HOY real

  const configEstados = {
    finalizada: "#000",
    cancelada: "#ff0000",
    pendiente: "#ffff00",
    confirmada: "#008000",
  };

  // --- EFECTO PRINCIPAL DE CARGA DE DATOS ---
  useEffect(() => {
    if (!profesionalId) return;

    // Reseteamos estados al cambiar filtro
    setCitasVisualizadas([]);
    setUltimoDoc(null);
    setCargandoInicial(true);

    let unsubscribe = () => {};

    if (filtroTiempo === "hoy") {
      // MODO REALTIME: Solo para el día de hoy
      // Esto asegura que si entra una cita nueva AHORA MISMO, aparezca sin recargar
      const q = query(
        collection(db, "citas"),
        where("barberoId", "==", profesionalId),
        where("fechaCita", "==", hoyReal), // Siempre fecha actual
        orderBy("horaCita", "asc"),
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCitasVisualizadas(docs);
          setCargandoInicial(false);
        },
        (error) => {
          console.error("Error listening citas hoy:", error);
          setCargandoInicial(false);
        },
      );
    } else {
      // MODO PAGINACIÓN: Para historial o futuro (ahorro de consultas)
      cargarCitasPaginadas(true);
      // No hay unsubscribe en getDocs, así que devolvemos vacío
    }

    return () => unsubscribe();
  }, [filtroTiempo, profesionalId]);

  // --- FUNCIÓN DE PAGINACIÓN (Limit + 1) ---
  const cargarCitasPaginadas = async (esNuevaConsulta = false) => {
    if (!profesionalId) return;

    // Si no es nueva consulta, activamos loading del botón
    if (!esNuevaConsulta) setCargandoMas(true);

    const LIMITE_VISIBLE = 10;
    const queryLimit = LIMITE_VISIBLE + 1;

    try {
      let q;
      const baseRef = collection(db, "citas");

      if (filtroTiempo === "7dias") {
        const proximaSemana = new Date();
        proximaSemana.setDate(proximaSemana.getDate() + 7);
        const fechaLimite = proximaSemana.toISOString().split("T")[0];

        q = query(
          baseRef,
          where("barberoId", "==", profesionalId),
          where("fechaCita", ">=", hoyReal),
          where("fechaCita", "<=", fechaLimite),
          orderBy("fechaCita", "asc"),
          limit(queryLimit),
        );
      } else if (filtroTiempo === "todo") {
        q = query(
          baseRef,
          where("barberoId", "==", profesionalId),
          orderBy("fechaCita", "desc"),
          limit(queryLimit),
        );
      }

      // Si es paginación, añadimos startAfter
      if (!esNuevaConsulta && ultimoDoc) {
        q = query(q, startAfter(ultimoDoc));
      }

      const snapshot = await getDocs(q);
      const docsEfectivos = snapshot.docs;
      const hayMas = docsEfectivos.length > LIMITE_VISIBLE;

      const docsParaMostrar = hayMas
        ? docsEfectivos.slice(0, LIMITE_VISIBLE)
        : docsEfectivos;

      const nuevosDatos = docsParaMostrar.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Manejo del cursor
      if (docsParaMostrar.length > 0) {
        setUltimoDoc(
          hayMas ? docsParaMostrar[docsParaMostrar.length - 1] : null,
        );
      } else {
        setUltimoDoc(null);
      }

      setCitasVisualizadas((prev) =>
        esNuevaConsulta ? nuevosDatos : [...prev, ...nuevosDatos],
      );
    } catch (error) {
      console.error("Error paginación:", error);
    } finally {
      setCargandoMas(false);
      setCargandoInicial(false);
    }
  };

  // Filtrado local por ESTADO (Pendiente, confirmada, etc.)
  const filtradas = citasVisualizadas.filter((c) =>
    estadosActivos.includes(c.estado),
  );
  const obtenerEtiquetaHoy = () => {
    const opciones = {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    };
    // Usamos "hoyReal" que definimos antes (new Date().toISOString().split('T')[0])
    const fecha = new Date(hoyReal + "T00:00:00").toLocaleDateString(
      "es-CL",
      opciones,
    );
    return `Hoy (${fecha})`;
  };
  return (
    <section className="seccion-citas">
      <div className="header-citas-filtros">
        <h2>Reservas</h2>
        <div className="chips-estados">
          {Object.entries(configEstados).map(([est, color]) => (
            <div
              key={est}
              className="estadosCheck"
              onClick={() =>
                setEstadosActivos((prev) =>
                  prev.includes(est)
                    ? prev.filter((e) => e !== est)
                    : [...prev, est],
                )
              }
              style={{
                backgroundColor: color,
                boxShadow: estadosActivos.includes(est)
                  ? "inset 0 1px 2px rgba(255, 255, 255, 0.25), 0 1px 2px rgba(0, 0, 0, 0.25),0 2px 4px rgba(0, 0, 0, 0.1)"
                  : "none",
                opacity: estadosActivos.includes(est) ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      </div>

      <select
        className="select-tiempo-citas"
        value={filtroTiempo}
        onChange={(e) => setFiltroTiempo(e.target.value)}
      >
        <option value="hoy">{obtenerEtiquetaHoy()}</option>
        <option value="7dias">Próximos 7 días</option>
        <option value="todo">Todo</option>
      </select>

      <div className="listaCitas">
        {cargandoInicial ? (
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            Cargando citas...
          </p>
        ) : filtradas.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: "20px", color: "#666" }}>
            No hay citas para mostrar
          </p>
        ) : (
          filtradas.map((cita, index) => (
            <div
              data-estado={cita.estado}
              key={cita.id}
              className="cita"
              style={{ "--i": index }}
            >
              <div className="descCita">
                <div className="infoCita">
                  <p id="nombre">{cita.clienteNombre}</p>
                  <p id="servicio">{cita.servicioNombre}</p>
                  <p id="tiempo">
                    {cita.horaCita}{" "}
                    <span style={{ textTransform: "capitalize" }}>
                      {new Date(
                        cita.fechaCita + "T00:00:00",
                      ).toLocaleDateString("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </p>
                </div>
                <div className="estadoCita">
                  <span>{cita.estado}</span>

                  {cita.estado === "cancelada" ? (
                    <button
                      className="btnEliminarCita"
                      onClick={() => {
                        borrarCita(cita.id);
                      }}
                    >
                      Eliminar
                    </button>
                  ) : cita.estado !== "finalizada" ? (
                    <button
                      className="btnGestionar"
                      disabled={cita.estado === "finalizada"}
                      style={{
                        opacity: cita.estado === "finalizada" ? 0.5 : 1,
                        cursor:
                          cita.estado === "finalizada" ? "default" : "pointer",
                      }}
                      onClick={() =>
                        setMenuAbierto(menuAbierto === cita.id ? null : cita.id)
                      }
                    >
                      Gestionar
                    </button>
                  ) : (
                    <button
                      onClick={() => gestionarCita(cita, "contacto")}
                      className="btnGestionar"
                    >
                      Contactar
                    </button>
                  )}
                </div>
              </div>

              {/* MENU FLOTANTE (Misma lógica visual) */}
              {menuAbierto === cita.id && cita.estado !== "finalizada" && (
                <div className="menu-flotante">
                  <button
                    onClick={() => gestionarCita(cita, "cancelada")}
                    id="cancelar"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => gestionarCita(cita, "contacto")}
                    id="contactar"
                  >
                    Contactar
                  </button>
                  {cita.estado === "pendiente" && (
                    <button
                      onClick={() => gestionarCita(cita, "confirmada")}
                      id="confirmar"
                    >
                      Confirmar
                    </button>
                  )}
                  {cita.estado === "confirmada" && (
                    <button
                      onClick={() => gestionarCita(cita, "finalizada")}
                      id="finalizar"
                    >
                      Finalizar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Solo mostrar botón "Cargar más" si NO es hoy y hay más documentos */}
        {filtroTiempo !== "hoy" && ultimoDoc && (
          <button
            onClick={() => cargarCitasPaginadas(false)}
            disabled={cargandoMas}
            className="btn-cargar-mas"
          >
            {cargandoMas ? "Cargando..." : "Cargar más"}
          </button>
        )}
      </div>
    </section>
  );
};

export default Citas;
