import React, { useState, useEffect, useRef, useCallback } from "react";
import { getChatbotHistory, sendChatbotMessage } from "../services/api";
import { FaBookOpen, FaUserCircle, FaRobot, FaTimes, FaPaperPlane, FaSpinner } from "react-icons/fa";
import "./ChatbotBook.css";

export default function ChatbotBook({ token, minimized, setMinimized, onClose }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Corrige el timestamp para que sea válido y consistente
  const loadHistory = useCallback(async () => {
    try {
      const res = await getChatbotHistory(token);
      if (Array.isArray(res) && res.length > 0) {
        // Asegura que cada mensaje tenga un timestamp válido
        setHistory(res.map(msg => ({
          ...msg,
          timestamp: msg.created_at || msg.timestamp || new Date().toISOString()
        })));
      } else {
        setHistory([{
          sender: "bot",
          message: "¡Hola! Soy tu asistente académico de la Universidad de Cartagena. ¿En qué puedo ayudarte hoy?",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  }, [token]);

  // Cargar historial al iniciar
  useEffect(() => {
    if (!minimized && token) {
      loadHistory();
    }
  }, [token, minimized, loadHistory]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      sender: "user",
      message: input,
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatbotMessage(token, input);

      setHistory(prev => [...prev, {
        sender: "bot",
        message: res.reply,
        timestamp: new Date().toISOString(),
        resources: res.resources || []
      }]);
    } catch (error) {
      setHistory(prev => [...prev, {
        sender: "bot",
        message: "Lo siento, hubo un error al procesar tu solicitud. Por favor intenta nuevamente.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Elimina el botón de minimizar, solo deja la X para cerrar
  if (minimized) return null;

  return (
    <div className="unicartagena-chatbot">
      <div className="chatbot-header">
        <div className="header-content">
          {/* Icono de libro institucional */}
          <span style={{ marginRight: 10, fontSize: 26, color: "#ffd700" }}>
            <FaBookOpen />
          </span>
          <span className="chatbot-title">Asistente Académico</span>
          <div className="header-actions">
            <button 
              className="close-btn"
              onClick={onClose}
              title="Cerrar"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </div>

      <div className="chatbot-messages">
        {history.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            <div className="message-content">
              {/* Icono para el bot */}
              {msg.sender === 'bot' && (
                <span className="avatar" style={{ marginRight: 8, fontSize: 28, color: "#002147" }}>
                  <FaRobot />
                </span>
              )}
              <div className="message-bubble">
                <div className="message-text">{msg.message}</div>
                {msg.resources && msg.resources.length > 0 && (
                  <div className="resources">
                    <strong>Recursos relacionados:</strong>
                    <ul>
                      {msg.resources.map((res, i) => (
                        <li key={i}>
                          <a href={res.url} target="_blank" rel="noopener noreferrer">
                            {res.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="message-time">
                  {/* Corrige el formato de fecha para evitar "Invalid Date" */}
                  {msg.timestamp && !isNaN(Date.parse(msg.timestamp))
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ""}
                </div>
              </div>
              {/* Icono para el usuario */}
              {msg.sender === 'user' && (
                <span className="avatar" style={{ marginLeft: 8, fontSize: 28, color: "#bfa100" }}>
                  <FaUserCircle />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="send-btn"
        >
          {loading ? (
            <FaSpinner className="fa-spin" />
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </form>
    </div>
  );
}