import React, { useState, useEffect } from "react";
import { getChatbotHistory, sendChatbotMessage } from "../services/api";
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
import "./Chatbot.css"; // Archivo CSS que crearemos después

export default function FloatingChatbot({ token }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getChatbotHistory(token).then(setHistory);
    }
  }, [token, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    const userMessage = { sender: "user", message: input, timestamp: new Date() };
    setHistory(prev => [...prev, userMessage]);
    setInput("");
    
    try {
      const res = await sendChatbotMessage(token, input);
      setHistory(prev => [...prev, { 
        sender: "bot", 
        message: res.reply,
        timestamp: new Date()
      }]);
    } catch (error) {
      setHistory(prev => [...prev, { 
        sender: "bot", 
        message: "Lo siento, hubo un error al procesar tu mensaje.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className="chatbot-container">
      {!isOpen ? (
        <button className="chatbot-icon" onClick={toggleChat}>
          <FaRobot size={24} />
        </button>
      ) : (
        <div className={`chatbot-window ${isMinimized ? "minimized" : ""}`}>
          <div className="chatbot-header">
            <h3>Asistente Académico</h3>
            <div className="chatbot-actions">
              <button onClick={toggleMinimize} className="icon-button">
                {isMinimized ? "+" : "-"}
              </button>
              <button onClick={toggleChat} className="icon-button">
                <FaTimes />
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {history.length === 0 ? (
                  <div className="empty-state">
                    <p>¡Hola! Soy tu asistente académico. ¿En qué puedo ayudarte?</p>
                  </div>
                ) : (
                  history.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`message ${msg.sender}`}
                    >
                      <div className="message-content">
                        <div className="message-sender">
                          {msg.sender === "user" ? "Tú" : "Asistente"}
                        </div>
                        <div className="message-text">{msg.message}</div>
                        <div className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <form onSubmit={handleSend} className="chatbot-input">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !input.trim()}>
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}