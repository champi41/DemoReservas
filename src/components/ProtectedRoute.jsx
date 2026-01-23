import { Navigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando...</p>;

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
