const Barra = ({ onVistaChange, activeVista, vistas, rol }) => {
  return (
    <div className="fondo">
      <div className="barra">
        <button
          className={`navButton ${
            activeVista === vistas.CITAS ? "active" : ""
          }`}
          onClick={() => onVistaChange(vistas.CITAS)}
          id="navCitas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            fill="#000000"
            viewBox="0 0 24 24"
          >
            <path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2M5 20V8h14V6v14z"></path>
            <path d="M7 11h10v2H7z"></path>
          </svg>
        </button>
        <button
          className={`navButton ${
            activeVista === vistas.HORARIO ? "active" : ""
          }`}
          onClick={() => onVistaChange(vistas.HORARIO)}
          id="navHorario"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            fill="#000000"
            viewBox="0 0 24 24"
          >
            <path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2M5 20V8h14V6v14z"></path>
            <path d="M7 11h2v2H7zM11 11h2v2h-2zM15 11h2v2h-2zM7 15h2v2H7zM11 15h2v2h-2zM15 15h2v2h-2z"></path>
          </svg>
        </button>
        {rol === "admin" && (
          <button
            className={`navButton ${
              activeVista === vistas.SERVICIOS ? "active" : ""
            }`}
            onClick={() => onVistaChange(vistas.SERVICIOS)}
            id="navServicios"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              fill="#000000"
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2M5 19V5h14v14z"></path>
              <path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h10v2H7z"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Barra;
