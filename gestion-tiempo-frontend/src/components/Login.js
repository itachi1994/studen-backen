import React, { useState } from "react";
import { login as loginApi } from "../services/api";
import "./Login.css";

export default function Login({ onLogin, goToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await loginApi(email, password);
      if (data.token) {
        onLogin(data.token);
      } else {
        setError(data.message || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
        <h2 className="login-title">Iniciar sesión</h2>
        <p className="login-desc">
          Plataforma exclusiva para estudiantes de la Universidad de Cartagena.
        </p>
        <label htmlFor="email" className="login-label">
          Correo institucional
        </label>
        <input
          id="email"
          type="email"
          className="login-input"
          placeholder="Correo institucional"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="new-email" // Evita autocompletado
        />
        <label htmlFor="password" className="login-label">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          className="login-input"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password" // Evita autocompletado
        />
        <button className="login-btn" type="submit">
          Entrar
        </button>
        {error && <div className="login-error">{error}</div>}
        <div className="login-register-link">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            className="login-link-btn"
            onClick={goToRegister}
          >
            Regístrate
          </button>
        </div>
      </form>
    </div>
  );
}