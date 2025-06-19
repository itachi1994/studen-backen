import React, { useState } from "react";

export default function Register({ onRegister, goToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [simaUsername, setSimaUsername] = useState("");
  const [simaPassword, setSimaPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          sima_username: simaUsername,
          sima_password: simaPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Registro exitoso. Ahora puedes iniciar sesión.");
        setEmail(""); setPassword(""); setSimaUsername(""); setSimaPassword("");
        if (onRegister) onRegister();
      } else {
        setError(data.message || "Error al registrar usuario");
      }
    } catch (err) {
      setError("Error de red");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #002147 60%, #ffd700 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 24px #0002",
        padding: "40px 32px",
        minWidth: 340,
        maxWidth: 380,
        textAlign: "center"
      }}>
        <img
          src="https://www.unicartagena.edu.co/images/logo_uc.png"
          alt="Logo Universidad de Cartagena"
          style={{ height: 90, marginBottom: 16 }}
        />
        <h2 style={{ color: "#002147", marginBottom: 8 }}>Registro</h2>
        <p style={{ color: "#555", fontSize: 15, marginBottom: 24 }}>
          Ingresa tus datos institucionales y de SIMA para automatizar tu agenda.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo institucional"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #bdbdbd",
              fontSize: 16
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #bdbdbd",
              fontSize: 16
            }}
          />
          <input
            type="text"
            placeholder="Usuario SIMA"
            value={simaUsername}
            onChange={e => setSimaUsername(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #bdbdbd",
              fontSize: 16
            }}
          />
          <input
            type="password"
            placeholder="Contraseña SIMA"
            value={simaPassword}
            onChange={e => setSimaPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: 18,
              borderRadius: 6,
              border: "1px solid #bdbdbd",
              fontSize: 16
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              background: "#ffd700",
              color: "#002147",
              fontWeight: "bold",
              fontSize: 17,
              border: "none",
              borderRadius: 6,
              padding: "12px",
              marginBottom: 10,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            Registrarse
          </button>
          {success && <div style={{ color: "green", marginBottom: 10 }}>{success}</div>}
          {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
        </form>
        <div style={{ marginTop: 16 }}>
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={goToLogin}
            style={{
              background: "none",
              color: "#002147",
              textDecoration: "underline",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
}
