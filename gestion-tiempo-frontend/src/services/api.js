const API_URL = "http://localhost:5000/api";

export const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        sima_username: "1050038629",  // Mantener estos campos si son necesarios
        sima_password: "itachi1994"
      }),
    });
    return await response.json();
  } catch (error) {
    return { error: 'Error de conexión' };
  }
};

export async function getDashboard(token) {
  const res = await fetch("http://localhost:5000/api/dashboard/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return res.json();
}

export async function getTasks(token) {
  const res = await fetch(`${API_URL}/task`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getEvents(token) {
  const res = await fetch(`${API_URL}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getChatbotHistory(token) {
  const res = await fetch("http://localhost:5000/api/user/chatbot/history", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return res.json();
}

export async function sendChatbotMessage(token, message) {
  const res = await fetch(`${API_URL}/user/chatbot/message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function getAllEvents(token, mes = "", ano = "") {
  let url = `${API_URL}/events`;
  const params = [];
  if (mes) params.push(`mes=${encodeURIComponent(mes)}`);
  if (ano) params.push(`ano=${encodeURIComponent(ano)}`);
  if (params.length) url += "?" + params.join("&");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return res.json();
}

// Funciones para manejar materias (subjects)
export async function createSubject(token, subjectData) {
  const res = await fetch(`${API_URL}/subjects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subjectData),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Error al crear materia');
  }
  
  return res.json();
}

export async function getSubjects(token) {
  const res = await fetch(`${API_URL}/subjects`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

export async function updateSubject(token, subjectId, subjectData) {
  const res = await fetch(`${API_URL}/subjects/${subjectId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subjectData),
  });
  return res.json();
}

export async function deleteSubject(token, subjectId) {
  const res = await fetch(`${API_URL}/subjects/${subjectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

// Funciones adicionales para tareas
export async function createTask(token, taskData) {
  const res = await fetch(`${API_URL}/task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });
  return res.json();
}

export async function updateTask(token, taskId, taskData) {
  const res = await fetch(`${API_URL}/task/${taskId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });
  return res.json();
}

export async function deleteTask(token, taskId) {
  const res = await fetch(`${API_URL}/task/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

export async function getTasksByFilters(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.from_date) params.append('from_date', filters.from_date);
  if (filters.to_date) params.append('to_date', filters.to_date);
  
  const url = `${API_URL}/task${params.toString() ? '?' + params.toString() : ''}`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

export async function generateStudySchedule(token) {
  const res = await fetch(`${API_URL}/planning/schedule/generate`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

export async function getAvailability(token) {
  const res = await fetch(`${API_URL}/availability`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.json();
}

export async function createAvailability(token, availabilityData) {
  const res = await fetch(`${API_URL}/availability`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(availabilityData),
  });
  return res.json();
}