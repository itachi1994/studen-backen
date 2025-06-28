import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import EventsList from "./components/EventsList";
import ChatbotBook from "./components/ChatbotBook";
import Help from "./components/Help";
import Calendar from "./components/Calendar";
import Planner from "./components/Planner";
import SubjectManager from "./components/SubjectManager";
import { FaComments } from "react-icons/fa"; // Mejor icono para el botón flotante
import './index.css';

const banners = [
  {
    img: "/img/banner1.jpg",
    text: "¡Organiza tu tiempo y alcanza tus metas!"
  },
  {
    img: "/img/banner2.jpg",
    text: "La excelencia académica empieza con una buena gestión."
  },
  {
    img: "/img/banner3.jpg",
    text: "Universidad de Cartagena: Liderando el Caribe colombiano."
  }
];

function BannerRotativo() {
  const [idx, setIdx] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="uc-banner-rotativo">
      <img src={banners[idx].img} alt="Banner institucional" />
      <div className="uc-banner-text">{banners[idx].text}</div>
      <div className="uc-banner-indicators">
        {banners.map((_, i) => (
          <div
            key={i}
            className={`uc-banner-indicator ${i === idx ? 'active' : ''}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showRegister, setShowRegister] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotMinimized, setChatbotMinimized] = useState(false);

  const handleLogin = (jwt) => {
    setToken(jwt);
    localStorage.setItem("token", jwt);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  if (!token) {
    return (
      <div className="uc-login-bg">
        <header className="uc-header">
          <img
            src="/img/logo_uc.png"
            alt="Logo Universidad de Cartagena"
            className="uc-logo"
          />
          <span className="uc-title">Gestión de Tiempo Universitario</span>
        </header>
        <div className="uc-login-main">
          <div className="uc-login-left">
            <BannerRotativo />
          </div>
          <div className="uc-login-right">
            {showRegister ? (
              <Register
                onRegister={() => setShowRegister(false)}
                goToLogin={() => setShowRegister(false)}
              />
            ) : (
              <Login
                onLogin={handleLogin}
                goToRegister={() => setShowRegister(true)}
              />
            )}
          </div>
        </div>
        <footer className="uc-mision-vision-row">
          <div className="uc-mision-small">
            <b>Misión:</b> La Universidad de Cartagena forma profesionales íntegros, críticos y comprometidos con el desarrollo social, científico y cultural, contribuyendo al progreso de la región Caribe y del país.
          </div>
          <div className="uc-vision-small">
            <b>Visión:</b> Ser reconocida nacional e internacionalmente por la excelencia académica, la investigación, la innovación y la responsabilidad social, liderando procesos de transformación y equidad.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="uc-main-bg">
      <header className="uc-header">
        <img
          src="/img/logo_uc.png"
          alt="Logo Universidad de Cartagena"
          className="uc-logo"
        />
        <span className="uc-title">Gestión de Tiempo Universitario</span>
        <button onClick={handleLogout} className="uc-logout-btn">Cerrar sesión</button>
      </header>
      <nav className="uc-nav">
        <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>📊 Dashboard</button>
        <button className={activeTab === "planner" ? "active" : ""} onClick={() => setActiveTab("planner")}>📋 Planificador</button>
        <button className={activeTab === "calendar" ? "active" : ""} onClick={() => setActiveTab("calendar")}>📅 Calendario</button>
        <button className={activeTab === "subjects" ? "active" : ""} onClick={() => setActiveTab("subjects")}>📚 Materias</button>
        <button className={activeTab === "events" ? "active" : ""} onClick={() => setActiveTab("events")}>🎯 Eventos</button>
        <button className={activeTab === "help" ? "active" : ""} onClick={() => setActiveTab("help")}>❓ Ayuda</button>
      </nav>
      <main className="uc-content">
        {activeTab === "dashboard" && <Dashboard token={token} />}
        {activeTab === "planner" && <Planner token={token} />}
        {activeTab === "calendar" && <Calendar token={token} />}
        {activeTab === "subjects" && <SubjectManager token={token} />}
        {activeTab === "events" && <EventsList token={token} />}
        {activeTab === "help" && <Help />}
      </main>
      {/* Botón flotante para el chatbot */}
      {!showChatbot && (
        <button
          className="chatbot-fab"
          onClick={() => { setShowChatbot(true); setChatbotMinimized(false); }}
          aria-label="Abrir asistente"
        >
          <FaComments size={32} />
        </button>
      )}
      {showChatbot && (
        <div className="chatbot-float-window" style={{ bottom: chatbotMinimized ? 32 : 100 }}>
          <button
            className="chatbot-close-btn"
            onClick={() => setShowChatbot(false)}
            style={{ display: chatbotMinimized ? "none" : "block" }}
            aria-label="Cerrar asistente"
          >×</button>
          <ChatbotBook
            token={token}
            minimized={chatbotMinimized}
            setMinimized={setChatbotMinimized}
            onClose={() => setShowChatbot(false)}
          />
          {chatbotMinimized && (
            <button
              className="chatbot-fab"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                zIndex: 1003,
                boxShadow: "none"
              }}
              onClick={() => setChatbotMinimized(false)}
              aria-label="Restaurar asistente"
            >
              <FaComments size={32} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
