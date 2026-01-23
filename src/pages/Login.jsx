import { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./login.css";
const Login = () => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  const manejarLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      navigate("/admin"); // Si es correcto, lo mandamos al panel
    } catch (error) {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <div className="login">
      <form onSubmit={manejarLogin} className="loginForm">
        <h2>Acceso Empleado</h2>
        <input
          required
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setPass(e.target.value)}
        />
        <button>Entrar</button>
      </form>
    </div>
  );
};

export default Login;
