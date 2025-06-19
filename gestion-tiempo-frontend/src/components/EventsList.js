import React, { useEffect, useState } from "react";
import { getAllEvents } from "../services/api";

export default function EventsList({ token }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [error, setError] = useState("");

  const fetchEvents = (mesFiltro, anoFiltro) => {
    setLoading(true);
    setError("");
    getAllEvents(token, mesFiltro, anoFiltro)
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar los eventos.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents("", "");
    // eslint-disable-next-line
  }, [token]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchEvents(mes, ano);
  };

  return (
    <div>
      <h2>Todos los eventos SIMA</h2>
      <form onSubmit={handleFilter} style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Mes (ej: junio)"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
        />
        <input
          type="text"
          placeholder="Año (ej: 2025)"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
        />
        <button type="submit">Filtrar</button>
      </form>
      {loading && <div>Cargando eventos...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && (
        <ul>
          {events.length === 0 && <li>No hay eventos.</li>}
          {events.map((e, idx) => (
            <li key={idx}>
              <b>{e.nombre}</b> - {e.curso_nombre} ({e.dia} de {e.mes_ano})<br />
              <a href={e.url} target="_blank" rel="noopener noreferrer">Ver evento</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

