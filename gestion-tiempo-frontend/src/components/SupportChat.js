import React, { useState, useEffect } from "react";
import { sendSupportMessage, getSupportHistory } from "../services/api";

export default function SupportChat({ token }) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getSupportHistory(token).then(setHistory);
  }, [token]);

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus("");
    const data = await sendSupportMessage(token, message);
    if (data.error) {
      setStatus(data.error);
      return;
    }
    setStatus("Mensaje enviado. Un asesor te contactará pronto.");
    setMessage("");
    setHistory(h => [...h, { message, timestamp: new Date().toISOString() }]);
  };

  return (
    <div className="uc-help">
      <h2>Soporte en Tiempo Real</h2>
      <form onSubmit={handleSend} style={{ marginBottom: 16 }}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Describe tu problema o pregunta..."
          rows={3}
          style={{ width: "100%", borderRadius: 8, padding: 8, fontSize: 16 }}
        />
        <button type="submit" style={{ marginTop: 8 }}>Enviar mensaje</button>
      </form>
      {status && <div style={{ color: "#002147", marginBottom: 12 }}>{status}</div>}
      <h3>Historial de mensajes</h3>
      <ul>
        {history.length === 0 && <li>No has enviado mensajes de soporte.</li>}
        {history.map((msg, idx) => (
          <li key={idx}>
            <b>{new Date(msg.timestamp).toLocaleString()}:</b> {msg.message}
          </li>
        ))}
      </ul>
    </div>
  );
}