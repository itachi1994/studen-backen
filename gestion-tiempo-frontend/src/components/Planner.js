import React, { useState, useEffect } from 'react';
import './Planner.css';
import { generateStudySchedule, getAvailability, createAvailability } from '../services/api';

const Planner = ({ token }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [data, setData] = useState({
    tasks: [],
    subjects: [],
    events: []
  });
  const [loading, setLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    subject_id: ''
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSchedule, setAiSchedule] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [availabilityForm, setAvailabilityForm] = useState([
    { day: 'Lunes', enabled: false, start: '', end: '' },
    { day: 'Martes', enabled: false, start: '', end: '' },
    { day: 'Miércoles', enabled: false, start: '', end: '' },
    { day: 'Jueves', enabled: false, start: '', end: '' },
    { day: 'Viernes', enabled: false, start: '', end: '' },
    { day: 'Sábado', enabled: false, start: '', end: '' },
    { day: 'Domingo', enabled: false, start: '', end: '' },
  ]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  const hourOptions = Array.from({length: 24}, (_, i) => (i < 10 ? '0' : '') + i);
  const minuteOptions = ['00', '15', '30', '45'];

  const filters = [
    { key: 'all', label: 'Todas', icon: '📋', color: '#667eea' },
    { key: 'today', label: 'Hoy', icon: '📅', color: '#ff6b6b' },
    { key: 'week', label: 'Esta semana', icon: '📆', color: '#4ecdc4' },
    { key: 'urgent', label: 'Urgentes', icon: '🚨', color: '#ff4757' },
    { key: 'done', label: 'Completadas', icon: '✅', color: '#26de81' }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener tareas
      const tasksResponse = await fetch('http://localhost:5000/api/task', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Obtener materias
      const subjectsResponse = await fetch('http://localhost:5000/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Obtener eventos del calendario
      const calendarResponse = await fetch(
        `http://localhost:5000/api/calendar/data?month=${selectedDate.getMonth() + 1}&year=${selectedDate.getFullYear()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const tasksData = tasksResponse.ok ? await tasksResponse.json() : { tasks: [] };
      const subjectsData = subjectsResponse.ok ? await subjectsResponse.json() : { subjects: [] };
      const calendarData = calendarResponse.ok ? await calendarResponse.json() : { calendar_data: {}, subjects: [] };
      // Extraer todas las tareas de calendar_data
      const allCalendarTasks = Object.values(calendarData.calendar_data || {})
        .flatMap(day => day.tasks || []);
      setData({
        tasks: allCalendarTasks,
        subjects: subjectsData.subjects || calendarData.subjects || [],
        events: Object.values(calendarData.calendar_data || {}).flatMap(day => day.events || [])
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return data.tasks.filter(task => {
      switch (activeFilter) {
        case 'today':
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
          return taskDay.getTime() === today.getTime();
        
        case 'week':
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate >= today && dueDate <= weekLater;
        
        case 'urgent':
          return task.priority === 'high' && task.status === 'pending';
        
        case 'done':
          return task.status === 'done';
        
        default:
          return true;
      }
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    // Adaptar la estructura para el backend
    const dataToSend = {
      title: taskForm.title,
      description: taskForm.description,
      due_date: taskForm.due_date,
      priority: taskForm.priority, // el backend acepta 'low', 'medium', 'high'
      subjects_id: taskForm.subject_id ? Number(taskForm.subject_id) : undefined
    };
    console.log('Enviando tarea:', dataToSend);
    try {
      const response = await fetch('http://localhost:5000/api/task', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        setShowTaskForm(false);
        setTaskForm({
          title: '',
          description: '',
          due_date: '',
          priority: 'medium',
          subject_id: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const toggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === 'pending' ? 'done' : 'pending';
      
      const response = await fetch(`http://localhost:5000/api/task/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          status: newStatus
        })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#26de81';
      default: return '#667eea';
    }
  };

  const getTasksForDate = (date) => {
    const dateStr = date.toDateString();
    return data.tasks.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date).toDateString() === dateStr;
    });
  };

  const generateMiniCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
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
      const tasksCount = getTasksForDate(date).length;
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === new Date().toDateString();

      days.push({
        date,
        day,
        tasksCount,
        isSelected,
        isToday
      });
    }

    return days;
  };

  const filteredTasks = getFilteredTasks();

  const handleGenerateSchedule = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSchedule(null);
    try {
      const res = await generateStudySchedule(token);
      if (res.schedule && Object.keys(res.schedule).length > 0) {
        setAiSchedule(res.schedule);
        setShowScheduleModal(true);
      } else {
        setAiError(res.message || res.error || 'No se pudo generar el horario.');
      }
    } catch (err) {
      setAiError('Error al generar el horario.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenAvailability = async () => {
    setShowAvailabilityModal(true);
    setAvailabilityError(null);
    setAvailabilityLoading(false);
    try {
      const token = localStorage.getItem('token');
      const res = await getAvailability(token);
      setAvailability(res.availability || []);
    } catch (e) {
      setAvailability([]);
    }
  };

  const handleDayToggle = (dayIdx) => {
    setAvailabilityForm(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, enabled: !d.enabled } : d
    ));
  };

  const handleTimeChange = (dayIdx, field, value) => {
    setAvailabilityForm(prev => prev.map((d, i) =>
      i === dayIdx ? { ...d, [field]: value } : d
    ));
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const token = localStorage.getItem('token');
      // Mapeo de días de español a inglés para el backend
      const dayMap = {
        'Lunes': 'Monday',
        'Martes': 'Tuesday',
        'Miércoles': 'Wednesday',
        'Jueves': 'Thursday',
        'Viernes': 'Friday',
        'Sábado': 'Saturday',
        'Domingo': 'Sunday',
      };
      // Enviar solo días habilitados y con horas válidas
      const toSend = availabilityForm.filter(day => day.enabled && day.start && day.end).map(day => ({
        day_of_week: dayMap[day.day],
        start_time: day.start,
        end_time: day.end
      }));
      if (toSend.length === 0) {
        setAvailabilityError('Debes agregar al menos un día y rango de horas.');
        setAvailabilityLoading(false);
        return;
      }
      // Enviar cada bloque individualmente
      for (const block of toSend) {
        await createAvailability(token, block);
      }
      setShowAvailabilityModal(false);
    } catch (e) {
      setAvailabilityError('Error al guardar la disponibilidad.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="planner-loading">
        <div className="loading-spinner"></div>
        <p>Cargando planificador...</p>
      </div>
    );
  }

  return (
    <div className="planner-container">
      {/* Header */}
      <div className="planner-header">
        <h2>📋 Planificador de Estudio</h2>
        <div className="planner-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowTaskForm(true)}
          >
            + Nueva Tarea
          </button>
          <button 
            className="btn-ai"
            onClick={() => setShowAI(!showAI)}
          >
            🤖 Asistente IA
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="planner-filters">
        {filters.map(filter => (
          <button
            key={filter.key}
            className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
            style={{
              '--filter-color': filter.color,
              backgroundColor: activeFilter === filter.key ? filter.color : 'transparent',
              color: activeFilter === filter.key ? 'white' : filter.color,
              borderColor: filter.color
            }}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.icon} {filter.label}
            <span className="filter-count">
              {filter.key === 'all' ? data.tasks.length : getFilteredTasks().length}
            </span>
          </button>
        ))}
      </div>

      {/* Layout principal */}
      <div className="planner-layout">
        {/* Panel izquierdo: Lista de tareas */}
        <div className="planner-sidebar">
          <div className="tasks-section">
            <h3>📝 Tareas ({filteredTasks.length})</h3>
            <div className="tasks-list">
              {filteredTasks.length === 0 ? (
                <div className="no-tasks">
                  <p>No hay tareas para este filtro</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className={`task-item ${task.status}`}>
                    <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                    <div className="task-content">
                      <h4 className="task-title">{task.title}</h4>
                      {task.description && <p className="task-description">{task.description}</p>}
                      <div className="task-meta">
                        {task.subject_name && (
                          <span className="task-subject">{task.subject_name}</span>
                        )}
                        {task.due_date && (
                          <span className="task-due-date">
                            📅 {new Date(task.due_date).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="task-actions">
                      <button
                        className="btn-toggle"
                        onClick={() => toggleTaskStatus(task)}
                        title={task.status === 'done' ? 'Marcar pendiente' : 'Marcar completada'}
                      >
                        {task.status === 'done' ? '↩️' : '✅'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Centro: Mini calendario */}
        <div className="planner-center">
          <div className="mini-calendar">
            <div className="calendar-header">
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}>
                ←
              </button>
              <h3>
                {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}>
                →
              </button>
            </div>
            <div className="calendar-grid">
              <div className="calendar-days-header">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="day-header">{day}</div>
                ))}
              </div>
              <div className="calendar-days">
                {generateMiniCalendar().map((dayInfo, index) => (
                  <div
                    key={index}
                    className={`calendar-day ${dayInfo ? '' : 'empty'} ${
                      dayInfo?.isSelected ? 'selected' : ''
                    } ${dayInfo?.isToday ? 'today' : ''} ${dayInfo?.tasksCount > 0 ? 'has-tasks' : ''}`}
                    onClick={() => dayInfo && setSelectedDate(dayInfo.date)}
                  >
                    {dayInfo && (
                      <>
                        <span className="day-number">{dayInfo.day}</span>
                        {dayInfo.tasksCount > 0 && (
                          <span className="tasks-indicator">{dayInfo.tasksCount}</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Horario del día seleccionado */}
          <div className="day-schedule">
            <h3>📅 {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
            <div className="schedule-content">
              {getTasksForDate(selectedDate).length === 0 ? (
                <div className="no-schedule">
                  <p>No hay tareas programadas para este día</p>
                  <button className="btn-add-task" onClick={() => setShowTaskForm(true)}>
                    + Agregar tarea
                  </button>
                </div>
              ) : (
                getTasksForDate(selectedDate).map(task => (
                  <div key={task.id} className={`schedule-item ${task.status}`}>
                    <div className="schedule-time">
                      {task.due_date ? new Date(task.due_date).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 'Todo el día'}
                    </div>
                    <div className="schedule-task">
                      <h4>{task.title}</h4>
                      {task.subject_name && <span className="schedule-subject">{task.subject_name}</span>}
                    </div>
                    <div className="schedule-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho: Materias y IA */}
        <div className="planner-details">
          {/* Materias */}
          <div className="subjects-panel">
            <h3>📚 Materias ({data.subjects.length})</h3>
            <div className="subjects-list">
              {data.subjects.length === 0 ? (
                <div className="no-subjects">
                  <p>No hay materias registradas</p>
                  <button className="btn-add-subject">+ Agregar materia</button>
                </div>
              ) : (
                data.subjects.map(subject => {
                  const subjectTasks = data.tasks.filter(task => task.subject_id === subject.id);
                  const completedTasks = subjectTasks.filter(task => task.status === 'done').length;
                  const progress = subjectTasks.length > 0 ? (completedTasks / subjectTasks.length) * 100 : 0;

                  return (
                    <div key={subject.id} className="subject-card">
                      <div className="subject-header">
                        <div 
                          className="subject-color"
                          style={{ backgroundColor: subject.color || '#667eea' }}
                        ></div>
                        <div className="subject-info">
                          <h4>{subject.name}</h4>
                          <span className="subject-code">{subject.code}</span>
                        </div>
                      </div>
                      <div className="subject-stats">
                        <div className="stat">
                          <span className="stat-value">{subjectTasks.length}</span>
                          <span className="stat-label">Tareas</span>
                        </div>
                        <div className="stat">
                          <span className="stat-value">{Math.round(progress)}%</span>
                          <span className="stat-label">Progreso</span>
                        </div>
                      </div>
                      <div className="subject-progress">
                        <div 
                          className="progress-bar"
                          style={{ width: `${progress}%`, backgroundColor: subject.color || '#667eea' }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Asistente IA */}
          {showAI && (
            <div className="ai-panel">
              <h3>🤖 Asistente IA</h3>
              <div className="ai-suggestions">
                <button className="ai-suggestion" onClick={handleGenerateSchedule} disabled={aiLoading}>
                  {aiLoading ? 'Generando...' : '📊 Generar horario de estudio'}
                </button>
                <button className="ai-suggestion" onClick={handleOpenAvailability} type="button">
                  🕒 Configurar disponibilidad
                </button>
                <button className="ai-suggestion">
                  💡 Sugerencias de productividad
                </button>
                <button className="ai-suggestion">
                  📈 Análizar rendimiento
                </button>
                <button className="ai-suggestion">
                  🎯 Optimizar tareas
                </button>
              </div>
              {aiSchedule && showScheduleModal && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>Horario de estudio sugerido</h3>
                      <button className="btn-close" onClick={() => setShowScheduleModal(false)}>×</button>
                    </div>
                    <div className="schedule-table">
                      {Object.keys(aiSchedule).map(day => (
                        <div key={day} className="schedule-day-block">
                          <h4>{day}</h4>
                          <ul>
                            {aiSchedule[day].map((block, idx) => (
                              <li key={idx}>
                                <b>{block.title || block.subject || 'Bloque'}</b> {' '}
                                <span>{block.block || block.time}</span>
                                {block.description && <span> - {block.description}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {aiError && <div className="ai-error">{aiError}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Modal para nueva tarea */}
      {showTaskForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nueva Tarea</h3>
              <button className="btn-close" onClick={() => setShowTaskForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  required
                  placeholder="Título de la tarea"
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Descripción opcional"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha límite</label>
                  <input
                    type="datetime-local"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Prioridad</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Materia</label>
                <select
                  value={taskForm.subject_id}
                  onChange={(e) => setTaskForm({...taskForm, subject_id: e.target.value})}
                >
                  <option value="">Sin materia</option>
                  {data.subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para horario generado por IA */}
      {showScheduleModal && aiSchedule && (
        <div className="modal-overlay">
          <div className="modal-content schedule-modal">
            <div className="modal-header">
              <h3>Horario de Estudio Sugerido</h3>
              <button className="btn-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Aquí puedes personalizar cómo mostrar el horario generado */}
              <pre>{JSON.stringify(aiSchedule, null, 2)}</pre>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setShowScheduleModal(false)}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para disponibilidad semanal */}
      {showAvailabilityModal && (
        <div className="modal-overlay" onClick={() => setShowAvailabilityModal(false)}>
          <div className="modal-content availability-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Configura tu disponibilidad semanal</h3>
              <button className="btn-close" onClick={() => setShowAvailabilityModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveAvailability}>
                <div className="availability-grid">
                  {availabilityForm.map((day, dayIdx) => (
                    <div key={dayIdx} className="availability-day">
                      <label style={{display:'flex',alignItems:'center',gap:8}}>
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={() => handleDayToggle(dayIdx)}
                        />
                        <strong>{day.day}</strong>
                      </label>
                      {day.enabled && (
                        <div className="day-blocks">
                          <select
                            value={day.start.split(':')[0] || ''}
                            onChange={e => handleTimeChange(dayIdx, 'start', `${e.target.value}:${day.start.split(':')[1] || '00'}`)}
                            required
                          >
                            <option value="">--</option>
                            {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          :
                          <select
                            value={day.start.split(':')[1] || '00'}
                            onChange={e => handleTimeChange(dayIdx, 'start', `${day.start.split(':')[0] || '00'}:${e.target.value}`)}
                            required
                          >
                            {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <span> - </span>
                          <select
                            value={day.end.split(':')[0] || ''}
                            onChange={e => handleTimeChange(dayIdx, 'end', `${e.target.value}:${day.end.split(':')[1] || '00'}`)}
                            required
                          >
                            <option value="">--</option>
                            {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          :
                          <select
                            value={day.end.split(':')[1] || '00'}
                            onChange={e => handleTimeChange(dayIdx, 'end', `${day.end.split(':')[0] || '00'}:${e.target.value}`)}
                            required
                          >
                            {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {availabilityError && <div className="ai-error">{availabilityError}</div>}
                <div style={{marginTop: 16, textAlign: 'right'}}>
                  <button className="btn-primary" type="submit" disabled={availabilityLoading}>
                    {availabilityLoading ? 'Guardando...' : 'Guardar disponibilidad'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
