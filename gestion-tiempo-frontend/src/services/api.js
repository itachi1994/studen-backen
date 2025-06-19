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