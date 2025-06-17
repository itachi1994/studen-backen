from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.task import Task
from app.models.subject import Subject
from app.models.task_schema import TaskSchema
from datetime import datetime, timedelta

task_bp = Blueprint('task', __name__)
task_schema = TaskSchema()
task_list_schema = TaskSchema(many=True)

@task_bp.route('/task', methods=['POST'])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    data = request.get_json()
    errors = task_schema.validate(data)
    if errors:
        return jsonify(errors), 400

    # Elimina course_load_id del dict si existe
    data.pop('course_load_id', None)

    task = Task(user_id=user_id, **data)
    db.session.add(task)
    db.session.commit()
    return task_schema.jsonify(task), 201

@task_bp.route('/task', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()

    # Parámetros de filtro opcionales
    status_filter    = request.args.get('status')     # ?status=pending
    priority_filter  = request.args.get('priority')   # ?priority=high
    date_from_filter = request.args.get('from_date')  # ?from_date=2025-05-01
    date_to_filter   = request.args.get('to_date')    # ?to_date=2025-05-10

    query = Task.query.filter_by(user_id=user_id)

    if status_filter:
        query = query.filter(Task.status == status_filter)

    if priority_filter:
        query = query.filter(Task.priority == priority_filter)

    if date_from_filter:
        query = query.filter(Task.due_date >= date_from_filter)

    if date_to_filter:
        query = query.filter(Task.due_date <= date_to_filter)

    tasks = query.order_by(Task.due_date.asc()).all()
    return task_list_schema.jsonify(tasks), 200

@task_bp.route('/task/statistics', methods=['GET'])
@jwt_required()
def task_statistics():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id).all()

    total = len(tasks)
    completed = len([t for t in tasks if t.status == 'done'])
    pending = total - completed
    completion_rate = round((completed / total) * 100, 2) if total > 0 else 0

    priorities = {'low': 0, 'medium': 0, 'high': 0}
    for task in tasks:
        if task.priority in priorities:
            priorities[task.priority] += 1

    stats = {
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": pending,
        "completion_percentage": completion_rate,
        "priority_distribution": priorities
    }

    return jsonify(stats), 200


@task_bp.route('/task/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({"message": "Task not found"}), 404

    data = request.get_json()
    for k, v in data.items():
        setattr(task, k, v)

    db.session.commit()
    return task_schema.jsonify(task), 200

@task_bp.route('/task/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({"message": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200

# ✅ RF24 - Marcar tarea como completada o pendiente
@task_bp.route('/task/<int:task_id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({"message": "Task not found"}), 404

    data = request.get_json()
    status = data.get("status")

    if status not in ["pending", "done"]:
        return jsonify({"message": "Invalid status. Must be 'pending' or 'done'."}), 400

    task.status = status
    db.session.commit()
    return jsonify({"message": f"Task status updated to '{status}'."}), 200

@task_bp.route('/task/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task_by_id(task_id):
    user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({"message": "Task not found"}), 404
    return task_schema.jsonify(task), 200

@task_bp.route('/task/procrastination', methods=['GET'])
@jwt_required()
def detect_procrastination():
    user_id = get_jwt_identity()
    now = datetime.utcnow()
    # Tareas atrasadas
    overdue = Task.query.filter_by(user_id=user_id, status='pending').filter(Task.due_date < now).all()
    # Inactividad: no tareas completadas en 3 días
    recent_done = Task.query.filter_by(user_id=user_id, status='done').filter(Task.created_at >= now - timedelta(days=3)).count()
    suggestions = []
    if overdue:
        suggestions.append("Tienes tareas atrasadas. Intenta completar una en los próximos 15 minutos (reto rápido).")
        suggestions.append("Prueba la técnica Pomodoro o haz un mapa mental para avanzar.")
    if recent_done == 0:
        suggestions.append("No has completado tareas recientemente. ¿Quieres contactar a un compañero o tutor para motivarte?")
    if not suggestions:
        suggestions.append("¡Vas bien! Sigue así.")
    return jsonify({"procrastination_suggestions": suggestions}), 200