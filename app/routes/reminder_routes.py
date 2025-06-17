from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.task import Task
from app import db

reminder_bp = Blueprint('reminder', __name__)

# Endpoint para obtener las tareas que necesitan un recordatorio
@reminder_bp.route('/task/reminders', methods=['GET'])
@jwt_required()
def get_task_reminders():
    user_id = get_jwt_identity()
    now = datetime.utcnow()

    reminders = Task.query.filter_by(user_id=user_id).filter(Task.reminder_date <= now, Task.status == 'pending', Task.reminder_sent == False).all()

    def serialize_task(task):
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "reminder_date": task.reminder_date.isoformat() if task.reminder_date else None,
            "priority": task.priority,
            "status": task.status
        }

    return jsonify([serialize_task(task) for task in reminders]), 200

# Simulación de un job o cron para enviar recordatorios
def send_reminders():
    now = datetime.utcnow()
    tasks_to_remind = Task.query.filter(Task.reminder_date <= now, Task.status == 'pending', Task.reminder_sent == False).all()

    for task in tasks_to_remind:
        # Aquí es donde enviaríamos el recordatorio (por ejemplo, usando correo)
        send_email_reminder(task)
        task.reminder_sent = True
        db.session.commit()

def send_email_reminder(task):
    # Lógica para enviar el correo (usar Flask-Mail o un servicio de correo)
    print(f"Recordatorio enviado para la tarea {task.title}")

@reminder_bp.route('/task/suggest-review', methods=['GET'])
@jwt_required()
def suggest_review_days():
    user_id = get_jwt_identity()
    from app.models.user_schedule import UserSchedule
    import json
    schedule_obj = UserSchedule.query.filter_by(user_id=user_id).order_by(UserSchedule.created_at.desc()).first()
    if not schedule_obj:
        return jsonify({"message": "No hay horario guardado"}), 200
    schedule = schedule_obj.schedule_json
    if isinstance(schedule, str):
        schedule = json.loads(schedule)
    days_of_week = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    free_days = [d for d in days_of_week if not schedule.get(d)]
    if free_days:
        return jsonify({
            "suggestion": f"¡Tienes días libres: {', '.join(free_days)}! Aprovecha para repasar o adelantar tareas."
        }), 200
    return jsonify({"suggestion": "No hay días libres esta semana."}), 200
