import requests
import os

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY") 

def generate_schedule_with_deepseek(prompt):
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "Eres un asistente que ayuda a organizar horarios de estudio."},
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=60)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

def get_related_resources(prompt):
    """
    Usa DeepSeek para recomendar videos, artículos o ejercicios relacionados.
    """
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "Eres un asistente que recomienda recursos académicos útiles (videos, artículos, ejercicios) para estudiantes universitarios."},
            {"role": "user", "content": prompt}
        ]
    }
    response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=60)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

def generate_quiz_questions(topic):
    """
    Usa DeepSeek para generar preguntas de repaso o quizzes automáticos.
    """
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "Eres un asistente que genera preguntas de repaso tipo quiz para estudiantes universitarios."},
            {"role": "user", "content": f"Genera 5 preguntas de repaso sobre el tema: {topic}"}
        ]
    }
    response = requests.post(DEEPSEEK_API_URL, headers=headers, json=data, timeout=60)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]
