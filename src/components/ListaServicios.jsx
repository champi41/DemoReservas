import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import Servicio from "./Servicio";
const ListaServicios = ({alSeleccionar, accion}) => {
  const [servicios, setServicios] = useState([]);

  useEffect(() => {

    const unsubscribe = onSnapshot(collection(db, "servicios"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setServicios(docs);
    });

    return () => unsubscribe(); 
  }, []);

  return (
    <div className="listaServicios">
      {servicios.map((servicio) => (
        <Servicio key={servicio.id} servicio={servicio} alSeleccionar={alSeleccionar} accion={accion}></Servicio>
      ))}
    </div>
  );
};

export default ListaServicios;
