import React, { useEffect, useState } from "react";

export default function Help() {
  const [help, setHelp] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/user/help")
      .then(res => res.json())
      .then(setHelp);
  }, []);

  if (!help) return <div>Cargando ayuda...</div>;

  return (
    <div className="uc-help">
      <h2>Ayuda y Consejos</h2>
      <p>{help.bienvenida}</p>
      <h3>Tips de uso</h3>
      <ul>
        {help.tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
      </ul>
      <h3>Preguntas Frecuentes</h3>
      <ul>
        {help.faq.map((item, idx) => (
          <li key={idx}>
            <b>{item.pregunta}</b>
            <div>{item.respuesta}</div>
          </li>
        ))}
      </ul>
      <h3>Enlaces útiles</h3>
      <ul>
        {help.enlaces_utiles.map((enlace, idx) => (
          <li key={idx}>
            <a href={enlace.url} target="_blank" rel="noopener noreferrer">{enlace.nombre}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
