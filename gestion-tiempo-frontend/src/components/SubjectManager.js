import React, { useState, useEffect } from 'react';
import './SubjectManager.css';

const SubjectManager = ({ token }) => {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    professor: '',
    credits: '',
    difficulty: 3,
    priority: 3,
    weekly_hours: '',
    color: '#667eea'
  });

  const difficultyLabels = {
    1: '🟢 Muy Fácil',
    2: '🟡 Fácil', 
    3: '🟠 Normal',
    4: '🔴 Difícil',
    5: '🔥 Muy Difícil'
  };

  const priorityLabels = {
    1: '🔵 Muy Baja',
    2: '⚪ Baja',
    3: '🟡 Normal', 
    4: '🟠 Alta',
    5: '🔴 Muy Alta'
  };

  const predefinedColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#fad0c4', '#ffd1ff', '#a8edea', '#fed6e3',
    '#ff9a9e', '#fecfef', '#ffecd2', '#fcb69f'
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(Array.isArray(data) ? data : (data.subjects || []));
      } else {
        console.error('Error fetching subjects');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convertir a número los campos necesarios
    const dataToSend = {
      ...formData,
      credits: formData.credits ? Number(formData.credits) : undefined,
      weekly_hours: formData.weekly_hours ? Number(formData.weekly_hours) : undefined,
      difficulty: formData.difficulty ? Number(formData.difficulty) : undefined,
      priority: formData.priority ? Number(formData.priority) : undefined,
    };
    console.log('Enviando:', dataToSend); // <-- Aquí verás en consola lo que se envía
    try {
      const url = editingSubject 
        ? `http://localhost:5000/api/subjects/${editingSubject.id}`
        : 'http://localhost:5000/api/subjects';
      
      const method = editingSubject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        fetchSubjects();
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Error saving subject', errorData); // <-- Aquí verás el error exacto
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (subjectId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta materia? Se eliminarán también todas las tareas asociadas.')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchSubjects();
      } else {
        console.error('Error deleting subject');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      professor: '',
      credits: '',
      difficulty: 3,
      priority: 3,
      weekly_hours: '',
      color: '#667eea'
    });
    setEditingSubject(null);
    setShowForm(false);
  };

  const startEdit = (subject) => {
    setFormData({
      name: subject.name,
      code: subject.code || '',
      professor: subject.professor || '',
      credits: subject.credits || '',
      difficulty: subject.difficulty || 3,
      priority: subject.priority || 3,
      weekly_hours: subject.weekly_hours || '',
      color: subject.color || '#667eea'
    });
    setEditingSubject(subject);
    setShowForm(true);
  };

  const getSubjectStats = (subject) => {
    // En una implementación real, obtendrías las tareas de esta materia
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      progress: 0
    };
  };

  if (loading) {
    return (
      <div className="subject-manager-loading">
        <div className="loading-spinner"></div>
        <p>Cargando materias...</p>
      </div>
    );
  }

  return (
    <div className="subject-manager">
      <div className="subject-manager-header">
        <div className="header-content">
          <h2>📚 Gestión de Materias</h2>
          <p>Organiza tus materias académicas y controla tu progreso</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Nueva Materia
        </button>
      </div>

      <div className="subjects-grid">
        {subjects.length === 0 ? (
          <div className="no-subjects">
            <div className="no-subjects-content">
              <h3>📖 No hay materias registradas</h3>
              <p>Agrega tus materias para comenzar a organizar tu tiempo de estudio</p>
              <button 
                className="btn-primary"
                onClick={() => setShowForm(true)}
              >
                Agregar Primera Materia
              </button>
            </div>
          </div>
        ) : (
          subjects.map(subject => {
            const stats = getSubjectStats(subject);
            
            return (
              <div key={subject.id} className="subject-card">
                <div className="subject-header">
                  <div 
                    className="subject-color-indicator"
                    style={{ backgroundColor: subject.color || '#667eea' }}
                  ></div>
                  <div className="subject-main-info">
                    <h3 className="subject-name">{subject.name}</h3>
                    <p className="subject-code">{subject.code}</p>
                  </div>
                  <div className="subject-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => startEdit(subject)}
                      title="Editar materia"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(subject.id)}
                      title="Eliminar materia"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="subject-details">
                  <div className="detail-row">
                    <span className="detail-label">👨‍🏫 Profesor:</span>
                    <span className="detail-value">{subject.professor || 'No especificado'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">⭐ Créditos:</span>
                    <span className="detail-value">{subject.credits || 'N/A'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">⏱️ Horas/semana:</span>
                    <span className="detail-value">{subject.weekly_hours || 'N/A'}</span>
                  </div>
                </div>

                <div className="subject-indicators">
                  <div className="indicator">
                    <span className="indicator-label">Dificultad</span>
                    <span className="indicator-value difficulty">
                      {difficultyLabels[subject.difficulty] || difficultyLabels[3]}
                    </span>
                  </div>
                  
                  <div className="indicator">
                    <span className="indicator-label">Prioridad</span>
                    <span className="indicator-value priority">
                      {priorityLabels[subject.priority] || priorityLabels[3]}
                    </span>
                  </div>
                </div>

                <div className="subject-stats">
                  <div className="stat">
                    <span className="stat-value">{stats.totalTasks}</span>
                    <span className="stat-label">Tareas</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{stats.progress}%</span>
                    <span className="stat-label">Progreso</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{stats.pendingTasks}</span>
                    <span className="stat-label">Pendientes</span>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: `${stats.progress}%`,
                      backgroundColor: subject.color || '#667eea' 
                    }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para crear/editar materia */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingSubject ? 'Editar Materia' : 'Nueva Materia'}</h3>
              <button className="btn-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre de la materia *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Ej: Cálculo Diferencial"
                  />
                </div>

                <div className="form-group">
                  <label>Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Ej: MAT101"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Profesor</label>
                <input
                  type="text"
                  value={formData.professor}
                  onChange={(e) => setFormData({...formData, professor: e.target.value})}
                  placeholder="Nombre del profesor"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Créditos</label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({...formData, credits: e.target.value})}
                    min="1"
                    max="10"
                    placeholder="3"
                  />
                </div>

                <div className="form-group">
                  <label>Horas por semana</label>
                  <input
                    type="number"
                    value={formData.weekly_hours}
                    onChange={(e) => setFormData({...formData, weekly_hours: e.target.value})}
                    min="1"
                    max="40"
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dificultad</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: parseInt(e.target.value)})}
                  >
                    {Object.entries(difficultyLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                  >
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Color de identificación</label>
                <div className="color-picker">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="color-input"
                  />
                  <div className="color-presets">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-preset ${formData.color === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({...formData, color: color})}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingSubject ? 'Actualizar' : 'Crear'} Materia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManager;
