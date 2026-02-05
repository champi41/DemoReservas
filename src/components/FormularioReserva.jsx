import { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
const FormularioReserva = ({
  servicioSeleccionado,
  barberoSeleccionado, // IMPORTANTE: Este objeto ahora trae { ...datosPro, fechaReserva, horaReserva }
  setServicioSeleccionado, // Función para cerrar/resetear
}) => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const manejarReserva = async (e) => {
    e.preventDefault();
    setEnviando(true);

    const telefonoLimpio = telefono.replace(/\D/g, "");
    if (telefonoLimpio.length < 8) {
      alert("Teléfono inválido.");
      setEnviando(false);
      return;
    }

    try {
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
        fechaCita: barberoSeleccionado.fechaReserva, // Dato que viene de SeleccionBarbero
        horaCita: barberoSeleccionado.horaReserva, // Dato que viene de SeleccionBarbero
        estado: "pendiente",
        creadoEn: serverTimestamp(),
      });

      // 3. El mensaje de éxito que mencionas
      alert(`¡Reserva realizada con éxito!`);

      // 4. Redirección automática al aceptar el alert
      // Usamos la ruta que definiste en tu App.js para GestionCita
      navigate(`/mi-cita/${docRef.id}`);

      // Limpiar el estado global si es necesario
      if (setServicioSeleccionado) setServicioSeleccionado(null);
    } catch (error) {
      console.error("Error al reservar: ", error);
      alert("Hubo un error al procesar tu reserva.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="datosCliente">
        <h2>Confirmar Reserva</h2>

        {/* Resumen de la selección */}
        <div className="resumen-reserva">
          <p>
            <strong>Servicio:</strong> {servicioSeleccionado.nombre}
          </p>
          <p>
            <strong>Profesional:</strong> {barberoSeleccionado.nombre}
          </p>
          <p>
            <strong>Fecha:</strong> {barberoSeleccionado.fechaReserva} a las{" "}
            {barberoSeleccionado.horaReserva}
          </p>
          <p className="total">
            <strong>Total:</strong> ${servicioSeleccionado.precio}
          </p>
        </div>

        <form onSubmit={manejarReserva}>
          <div className="campo">
            <label>Nombre y apellido</label>
            <input
              required
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div className="campo">
            <label>Teléfono</label>
            <input
              required
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 9 1234 5678"
            />
          </div>

          <div className="campo">
            <label>Correo Electrónico</label>
            <input
              required
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="botones-accion">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setServicioSeleccionado()} // Esto cancela todo
              disabled={enviando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? "Confirmando..." : "Finalizar"}
            </button>
          </div>
        </form>
    </div>
  );
};

export default FormularioReserva;
