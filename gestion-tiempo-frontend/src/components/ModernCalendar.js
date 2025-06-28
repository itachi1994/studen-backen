import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './ModernCalendar.css';

// Recibe props: calendarData, subjects
const ModernCalendar = ({ calendarData = {}, subjects = [] }) => {
  const [value, setValue] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Muestra materias arriba
  const renderSubjectsLegend = () => (
    <div className="subjects-legend-modern">
      <h4>📚 Materias</h4>
      <div className="subjects-grid-modern">
        {subjects.map(subject => (
          <div key={subject.id} className="subject-item-modern">
            <div className="subject-color-modern" style={{ backgroundColor: subject.color }}></div>
            <div className="subject-info-modern">
              <span className="subject-name-modern">{subject.name}</span>
              <span className="subject-details-modern">
                {subject.code} • {subject.credits} créditos
                {subject.weekly_hours && ` • ${subject.weekly_hours}h/semana`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Renderiza contenido de cada día
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const day = date.getDate();
    const data = calendarData[day] || { tasks: [], events: [] };
    return (
      <div className="tile-content-modern">
        {data.tasks.length > 0 && <span className="dot-task-modern" title="Tareas"></span>}
        {data.events.length > 0 && <span className="dot-event-modern" title="Eventos"></span>}
      </div>
    );
  };

  // Al seleccionar un día
  const onChange = (date) => {
    setValue(date);
    setSelectedDay(date.getDate());
  };

  // Detalles del día
  const renderDayDetails = () => {
    if (!selectedDay || !calendarData[selectedDay]) return null;
    const dayData = calendarData[selectedDay];
    const selectedDate = new Date(value.getFullYear(), value.getMonth(), selectedDay);
    return (
      <div className="day-details-modern">
        <h3>
          {selectedDate.toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </h3>
        {dayData.tasks.length > 0 && (
          <div className="detail-section-modern">
            <h4>📝 Tareas ({dayData.tasks.length})</h4>
            {dayData.tasks.map((task, idx) => (
              <div key={idx} className={`detail-item-modern task-item-modern ${task.status}`}>
                <span className="item-title-modern">{task.title}</span>
                <span className="item-subject-modern">{task.subject}</span>
                {task.time && <span className="item-time-modern">{task.time}</span>}
              </div>
            ))}
          </div>
        )}
        {dayData.events.length > 0 && (
          <div className="detail-section-modern">
            <h4>📅 Eventos ({dayData.events.length})</h4>
            {dayData.events.map((event, idx) => (
              <div key={idx} className="detail-item-modern event-item-modern">
                <span className="item-title-modern">{event.nombre}</span>
                <span className="item-subject-modern">{event.curso}</span>
              </div>
            ))}
          </div>
        )}
        {dayData.tasks.length === 0 && dayData.events.length === 0 && (
          <div className="no-items-modern">📭 No hay tareas ni eventos programados para este día</div>
        )}
      </div>
    );
  };

  return (
    <div className="modern-calendar-container">
      <div className="subjects-legend-modern">
        {renderSubjectsLegend()}
      </div>
      <div className="calendar-panel-modern">
        <Calendar
          onChange={onChange}
          value={value}
          tileContent={tileContent}
          locale="es-ES"
          className="react-calendar-modern"
        />
        {renderDayDetails()}
      </div>
    </div>
  );
};

export default ModernCalendar;
