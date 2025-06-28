import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await fetch(
        `http://localhost:5000/api/calendar/data?month=${month}&year=${year}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCalendarData(data.calendar_data || {});
        setSubjects(data.subjects || []);
      } else {
        console.error('Error fetching calendar data');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Genera los días del mes en formato grid tipo mini calendario
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days = [];
    // Días vacíos del mes anterior
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const data = calendarData[day] || { tasks: [], events: [] };
      const isSelected = selectedDay === day;
      const isToday = date.toDateString() === new Date().toDateString();
      days.push({
        date,
        day,
        data,
        isSelected,
        isToday
      });
    }
    // Completar la última semana con días vacíos
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa726';
      case 'low': return '#66bb6a';
      default: return '#78909c';
    }
  };

  const getStatusColor = (status) => {
    return status === 'done' ? '#4caf50' : '#2196f3';
  };

  // Nuevo render del calendario principal tipo mini calendario
  const renderCalendarGrid = () => {
    const days = generateCalendarGrid();
    return (
      <div className="calendar-grid">
        {/* Headers de días */}
        {dayNames.map(day => (
          <div key={day} className="calendar-header">{day}</div>
        ))}
        {/* Días del calendario */}
        {days.map((dayInfo, index) => (
          <div
            key={index}
            className={`calendar-day ${!dayInfo ? 'empty' : ''} ${dayInfo?.isSelected ? 'selected' : ''} ${dayInfo?.isToday ? 'today' : ''} ${(dayInfo?.data?.tasks.length > 0) ? 'has-tasks' : ''}`}
            onClick={() => dayInfo && setSelectedDay(dayInfo.day)}
          >
            {dayInfo && (
              <>
                <span className="day-number">{dayInfo.day}</span>
                {dayInfo.data.tasks.length > 0 && (
                  <span className="tasks-indicator">{dayInfo.data.tasks.length}</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDayDetails = () => {
    if (!selectedDay || !calendarData[selectedDay]) return null;

    const dayData = calendarData[selectedDay];
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);

    return (
      <div className="day-details">
        <h3>
          {selectedDate.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        
        {/* Tareas del día */}
        {dayData.tasks.length > 0 && (
          <div className="detail-section">
            <h4>📝 Tareas ({dayData.tasks.length})</h4>
            {dayData.tasks.map((task, idx) => (
              <div 
                key={idx} 
                className={`detail-item task-item ${task.status}`}
                style={{ borderLeft: `4px solid ${getPriorityColor(task.priority)}` }}
              >
                <div className="item-header">
                  <span className="item-title">{task.title}</span>
                  <span className="item-subject">{task.subject}</span>
                  {task.time && <span className="item-time">{task.time}</span>}
                </div>
                {task.description && (
                  <div className="item-description">{task.description}</div>
                )}
                <div className="item-meta">
                  <span className={`priority ${task.priority}`}>
                    {task.priority === 'high' ? '🔴 Alta' : 
                     task.priority === 'medium' ? '🟡 Media' : '🟢 Baja'}
                  </span>
                  <span className={`status ${task.status}`}>
                    {task.status === 'done' ? '✅ Completada' : '⏳ Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Eventos del día */}
        {dayData.events.length > 0 && (
          <div className="detail-section">
            <h4>📅 Eventos ({dayData.events.length})</h4>
            {dayData.events.map((event, idx) => (
              <div key={idx} className="detail-item event-item">
                <div className="item-header">
                  <span className="item-title">{event.nombre}</span>
                  <span className="item-subject">{event.curso}</span>
                </div>
                {event.url && (
                  <a 
                    href={event.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="event-link"
                  >
                    🔗 Ver enlace
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        
        {dayData.tasks.length === 0 && dayData.events.length === 0 && (
          <div className="no-items">
            📭 No hay tareas ni eventos programados para este día
          </div>
        )}
      </div>
    );
  };

  const renderSubjectsLegend = () => {
    if (subjects.length === 0) return null;

    return (
      <div className="subjects-legend">
        <h4>📚 Materias</h4>
        <div className="subjects-grid">
          {subjects.map(subject => (
            <div key={subject.id} className="subject-item">
              <div 
                className="subject-color" 
                style={{ backgroundColor: subject.color }}
              ></div>
              <div className="subject-info">
                <span className="subject-name">{subject.name}</span>
                <span className="subject-details">
                  {subject.code} • {subject.credits} créditos
                  {subject.weekly_hours && ` • ${subject.weekly_hours}h/semana`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="loading-spinner"></div>
        <p>Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      {/* Header del calendario */}
      <div className="calendar-header-controls">
        <div className="calendar-navigation">
          <button onClick={() => navigateMonth(-1)} className="nav-button">
            ← Anterior
          </button>
          <h2 className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={() => navigateMonth(1)} className="nav-button">
            Siguiente →
          </button>
        </div>
        <div className="calendar-actions">
          <button onClick={goToToday} className="today-button">
            Hoy
          </button>
        </div>
      </div>

      {/* Materias arriba del calendario */}
      {renderSubjectsLegend()}

      <div className="calendar-content">
        {/* Calendario principal */}
        <div className="calendar-main">
          {renderCalendarGrid()}
        </div>

        {/* Panel lateral solo para detalles del día */}
        <div className="calendar-sidebar">
          {renderDayDetails()}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
