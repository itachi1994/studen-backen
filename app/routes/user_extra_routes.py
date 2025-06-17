from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.task import Task
from app.models.evento import Evento
from datetime import datetime, timedelta

user_extra_bp = Blueprint('user_extra', __name__)

comment_schema = CommentSchema()
comment_many_schema = CommentSchema(many=True)

# 2. Notificaciones Push (estructura básica, integración real requiere frontend y FCM)
@user_extra_bp.route('/user/notify/push', methods=['POST'])
@jwt_required()
def send_push_notification():   
    user_id = get_jwt_identity()
    data = request.get_json()
    message = data.get("message", "¡Tienes una nueva notificación!")
    # Aquí solo simulamos el envío
    return jsonify({"status": "ok", "message": f"Push enviado a usuario {user_id}: {message}"}), 200

# 3. Historial de actividad del usuario (simple: tareas creadas/completadas)
@user_extra_bp.route('/user/activity/history', methods=['GET'])
@jwt_required()
def user_activity_history():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id).order_by(Task.created_at.desc()).all()
    history = [
        {
            "action": "created" if t.status == "pending" else "completed",
            "title": t.title,
            "date": t.created_at.isoformat()
        }
        for t in tasks
    ]
    return jsonify({"history": history}), 200

# 4. Adjuntar archivos a tareas (estructura, requiere frontend y almacenamiento real)
@user_extra_bp.route('/task/<int:task_id>/attach', methods=['POST'])
@jwt_required()
def attach_file(task_id):
    # Aquí solo simulamos la recepción del archivo
    # En producción, usar Flask-Uploads o S3
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    # file.save(...)
    return jsonify({"message": f"Archivo '{file.filename}' recibido para la tarea {task_id}"}), 200

# 5. Comentarios en tareas (estructura simple, sin modelo persistente)
@user_extra_bp.route('/task/<int:task_id>/comment', methods=['POST'])
@jwt_required()
def comment_task(task_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    content = data.get("comment")
    if not content:
        return jsonify({"error": "Comentario vacío"}), 400
    comment = Comment(task_id=task_id, user_id=user_id, content=content)
    db.session.add(comment)
    db.session.commit()
    return comment_schema.jsonify(comment), 201

@user_extra_bp.route('/task/<int:task_id>/comments', methods=['GET'])
@jwt_required()
def list_comments(task_id):
    comments = Comment.query.filter_by(task_id=task_id).order_by(Comment.created_at.asc()).all()
    return comment_many_schema.jsonify(comments), 200

# 6. Recomendaciones de técnicas de estudio personalizadas
@user_extra_bp.route('/user/study-tips', methods=['GET'])
@jwt_required()
def study_tips():
    user_id = get_jwt_identity()
    # Ejemplo simple: según tareas atrasadas
    now = datetime.utcnow()
    overdue = Task.query.filter_by(user_id=user_id, status='pending').filter(Task.due_date < now).count()
    if overdue > 2:
        tip = "Prueba la técnica Pomodoro para avanzar en tareas atrasadas."
    else:
        tip = "¡Sigue así! Mantén bloques de estudio de 50 minutos y descansa 10."
    return jsonify({"tip": tip}), 200

# 7. Integración con chatbots (estructura básica)
@user_extra_bp.route('/user/chatbot/message', methods=['POST'])
@jwt_required()
def chatbot_message():
    user_id = get_jwt_identity()
    data = request.get_json()
    message = data.get("message", "")

    msg_lower = message.lower()

    # Tareas pendientes esta semana
    if "pendiente" in msg_lower or "tengo que hacer" in msg_lower:
        now = datetime.utcnow()
        week_later = now + timedelta(days=7)
        tasks = Task.query.filter_by(user_id=user_id, status='pending').filter(
            Task.due_date >= now, Task.due_date <= week_later
        ).order_by(Task.due_date.asc()).all()
        if not tasks:
            reply = "No tienes tareas pendientes para esta semana. ¡Buen trabajo!"
        else:
            reply = "Tienes estas tareas pendientes esta semana:\n" + "\n".join(
                f"- {t.title} (vence {t.due_date.strftime('%Y-%m-%d')})" for t in tasks
            )
        return jsonify({"reply": reply}), 200

    # Eventos próximos esta semana
    if "evento" in msg_lower or "clase" in msg_lower or "agenda" in msg_lower:
        today = datetime.utcnow()
        eventos = []
        for delta in range(0, 8):
            check_date = today + timedelta(days=delta)
            dia = str(check_date.day)
            mes_ano = check_date.strftime("%B %Y").lower()
            evs = Evento.query.filter(
                Evento.dia == dia,
                Evento.mes_ano.ilike(f"%{mes_ano}%")
            ).all()
            for e in evs:
                eventos.append(f"- {e.nombre} ({e.curso_nombre}) el {e.dia} de {e.mes_ano}")
        if not eventos:
            reply = "No tienes eventos próximos en tu agenda esta semana."
        else:
            reply = "Tus eventos próximos esta semana:\n" + "\n".join(eventos)
        return jsonify({"reply": reply}), 200

    # Estadísticas de avance
    if "avance" in msg_lower or "progreso" in msg_lower or "cómo voy" in msg_lower:
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        tasks = Task.query.filter(Task.user_id == user_id, Task.created_at >= week_ago).all()
        done = [t for t in tasks if t.status == 'done']
        pending = [t for t in tasks if t.status != 'done']
        percent = int((len(done) / len(tasks)) * 100) if tasks else 0
        reply = f"Esta semana completaste el {percent}% de tus tareas ({len(done)} completadas, {len(pending)} pendientes)."
        return jsonify({"reply": reply}), 200

    # Si la pregunta es académica, usa DeepSeek
    academic_keywords = ["organizar", "recurso", "tarea", "examen", "tema", "repaso", "quiz", "horario"]
    if any(word in msg_lower for word in academic_keywords):
        try:
            # Puedes ajustar el prompt para DeepSeek según el mensaje
            prompt = f"Soy un estudiante universitario. {message} Dame una respuesta personalizada y motivacional."
            from app.utils.deepseek_api import get_related_resources
            response = get_related_resources(prompt)
            return jsonify({"reply": response}), 200
        except Exception:
            return jsonify({"reply": "No pude consultar la IA en este momento. Intenta más tarde."}), 200

    # Respuestas motivacionales básicas
    if "hola" in msg_lower:
        reply = "¡Hola! ¿En qué puedo ayudarte con tus estudios hoy?"
    elif "gracias" in msg_lower:
        reply = "¡De nada! Recuerda que la constancia es clave para el éxito académico."
    else:
        reply = "Estoy aquí para ayudarte a organizarte y motivarte. Pregúntame sobre tus tareas, eventos, progreso o técnicas de estudio."

    return jsonify({"reply": reply}), 200
