from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.task import Task
from app.models.evento import Evento
from app.models.chat_message import ChatMessage
from app.models.chat_message_schema import ChatMessageSchema
from app.models.comment import Comment
from app.models.comment_schema import CommentSchema
from datetime import datetime, timedelta
from app.utils.deepseek_api import get_related_resources

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

    # Reinicio de conversación si el mensaje es "reiniciar" o similar
    if "reiniciar" in msg_lower or "borrar" in msg_lower:
        ChatMessage.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        reply = "¡Conversación reiniciada! ¿En qué puedo ayudarte ahora?"
        bot_msg = ChatMessage(user_id=user_id, sender="bot", message=reply)
        db.session.add(bot_msg)
        db.session.commit()
        return jsonify({"reply": reply}), 200

    # Guarda el mensaje del usuario
    user_msg = ChatMessage(user_id=user_id, sender="user", message=message)
    db.session.add(user_msg)
    db.session.commit()

    # Siempre consulta DeepSeek para cualquier mensaje
    try:
        prompt = f"Responde como tutor universitario: {message}"
        from app.utils.deepseek_api import get_related_resources
        response = get_related_resources(prompt)
        bot_msg = ChatMessage(user_id=user_id, sender="bot", message=response)
        db.session.add(bot_msg)
        db.session.commit()
        return jsonify({"reply": response}), 200
    except Exception:
        reply = "No pude consultar la IA en este momento. Intenta más tarde."
        bot_msg = ChatMessage(user_id=user_id, sender="bot", message=reply)
        db.session.add(bot_msg)
        db.session.commit()
        return jsonify({"reply": reply}), 200

# Modelo simple para mensajes de soporte (puedes crear una tabla real si lo deseas)
support_messages = []

@user_extra_bp.route('/user/support', methods=['POST'])
@jwt_required()
def send_support_message():
    user_id = get_jwt_identity()
    data = request.get_json()
    message = data.get("message", "")
    if not message:
        return jsonify({"error": "El mensaje no puede estar vacío."}), 400
    support_messages.append({
        "user_id": user_id,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    })
    return jsonify({"status": "ok", "message": "Tu mensaje de soporte fue recibido. Un asesor te contactará pronto."}), 200

@user_extra_bp.route('/user/support/history', methods=['GET'])
@jwt_required()
def get_support_history():
    user_id = get_jwt_identity()
    history = [msg for msg in support_messages if msg["user_id"] == user_id]
    return jsonify(history), 200

@user_extra_bp.route('/user/chatbot/history', methods=['GET'])
@jwt_required()
def chatbot_history():
    user_id = get_jwt_identity()
    messages = ChatMessage.query.filter_by(user_id=user_id).order_by(ChatMessage.created_at.asc()).all()
    return ChatMessageSchema(many=True).jsonify(messages), 200

@user_extra_bp.route('/user/help', methods=['GET'])
def user_help():
    ayuda = {
        "bienvenida": (
            "Bienvenido a la plataforma de Gestión de Tiempo Universitario de la Universidad de Cartagena. "
            "Aquí podrás organizar tus tareas, eventos, recibir recordatorios y consultar recursos académicos."
        ),
        "tips": [
            "Utiliza el chatbot para resolver dudas académicas o pedir recursos de estudio.",
            "Filtra tus eventos por mes y año para ver tu agenda de manera clara.",
            "Activa el modo enfocado para evitar distracciones mientras estudias.",
            "Consulta tu progreso semanal y recibe retroalimentación personalizada.",
            "Adjunta archivos y agrega comentarios a tus tareas para un mejor seguimiento."
        ],
        "faq": [
            {
                "pregunta": "¿Cómo registro mis credenciales de SIMA?",
                "respuesta": "Debes ingresarlas al momento de registrarte. Si necesitas cambiarlas, actualiza tu perfil."
            },
            {
                "pregunta": "¿Por qué no veo mis eventos después de iniciar sesión?",
                "respuesta": "Asegúrate de que tus credenciales de SIMA sean correctas y espera unos segundos tras el login para que el sistema sincronice tus eventos."
            },
            {
                "pregunta": "¿Puedo acceder desde el celular?",
                "respuesta": "Sí, la plataforma es responsiva y próximamente estará disponible como app móvil."
            }
        ],
        "enlaces_utiles": [
            {"nombre": "Portal SIMA", "url": "https://sima.unicartagena.edu.co/"},
            {"nombre": "Universidad de Cartagena", "url": "https://www.unicartagena.edu.co/"},
            {"nombre": "Soporte TIC", "url": "https://www.unicartagena.edu.co/soporte-tic"}
        ]
    }
    return jsonify(ayuda), 200