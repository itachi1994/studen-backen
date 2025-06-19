import React, { useEffect, useState } from "react";
import { getDashboard } from "../services/api";
import "./Dashboard.css";

export default function Dashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard(token)
      .then(setData)
      .catch(() => setError("Error al cargar el panel"));
  }, [token]);

  if (error) return <div className="dashboard-error">{error}</div>;
  if (!data) return <div className="dashboard-loading">Cargando...</div>;

  const urgentTasks = data.urgent_tasks || [];
  const upcomingTasks = data.upcoming_tasks || [];
  const upcomingEvents = data.upcoming_events || [];

  return (
    <div className="dashboard-main">
      <h2 className="dashboard-title">Panel de Actividades</h2>
      <div className="dashboard-grid">
        <div className="dashboard-card urgent">
          <h3>🔥 Tareas urgentes</h3>
          <ul>
            {urgentTasks.length === 0 && <li>No hay tareas urgentes.</li>}
            {urgentTasks.map((t) => (
              <li key={t.id}>
                <b>{t.title}</b>
                <span className="dashboard-date">Vence: {t.due_date}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="dashboard-card upcoming">
          <h3>📅 Tareas próximas</h3>
          <ul>
            {upcomingTasks.length === 0 && <li>No hay tareas próximas.</li>}
            {upcomingTasks.map((t) => (
              <li key={t.id}>
                <b>{t.title}</b>
                <span className="dashboard-date">Vence: {t.due_date}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="dashboard-card events">
          <h3>🎓 Eventos SIMA</h3>
          <ul>
            {upcomingEvents.length === 0 && <li>No hay eventos próximos.</li>}
            {upcomingEvents.map((e, idx) => (
              <li key={idx}>
                <b>{e.nombre}</b>
                <div className="dashboard-event-info">
                  <span>{e.curso_nombre}</span>
                  <span>
                    {e.dia} de {e.mes_ano}
                  </span>
                </div>
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dashboard-link"
                >
                  Ver evento
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}



