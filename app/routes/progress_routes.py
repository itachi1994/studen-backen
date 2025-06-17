from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.task import Task
from app.models.progress import ProgressReport
from app.models.progress_schema import ProgressReportSchema
from datetime import datetime, timedelta

progress_bp = Blueprint('progress', __name__)
progress_schema = ProgressReportSchema()

@progress_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_progress_reports():
    user_id = get_jwt_identity()
    reports = ProgressReport.query.filter_by(user_id=user_id).order_by(ProgressReport.created_at.desc()).all()
    return jsonify(progress_schema.dump(reports, many=True)), 200


@progress_bp.route('/progress', methods=['POST'])
@jwt_required()
def generate_progress_report():
    user_id = get_jwt_identity()
    data = request.get_json()
    period = data.get('period', 'weekly')

    if period not in ['weekly', 'monthly']:
        return jsonify({"error": "Invalid period"}), 400

    now = datetime.utcnow()
    since = now - timedelta(days=7 if period == 'weekly' else 30)

    tasks = Task.query.filter(Task.user_id == user_id, Task.created_at >= since).all()

    done = [t for t in tasks if t.status == 'done']
    pending = [t for t in tasks if t.status != 'done']

    report_lines = [
        f"Resumen {period}:",
        f"- Tareas completadas: {len(done)}",
        f"- Tareas pendientes: {len(pending)}"
    ]

    if len(done) == 0:
        report_lines.append(" Consejo: intenta completar al menos una tarea al día para mantener el ritmo.")
    elif len(done) < len(pending):
        report_lines.append(" Consejo: prioriza tareas con fechas próximas y mantén constancia.")

    final_report = "\n".join(report_lines)

    progress = ProgressReport(user_id=user_id, period=period, report=final_report)
    db.session.add(progress)
    db.session.commit()

    return progress_schema.jsonify(progress), 200

@progress_bp.route('/progress/statistics', methods=['GET'])
@jwt_required()
def progress_statistics():
    user_id = get_jwt_identity()
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    tasks = Task.query.filter(Task.user_id == user_id, Task.created_at >= week_ago).all()
    done = [t for t in tasks if t.status == 'done']
    pending = [t for t in tasks if t.status != 'done']
    percent = int((len(done) / len(tasks)) * 100) if tasks else 0
    return jsonify({
        "completed": len(done),
        "pending": len(pending),
        "completion_percent": percent,
        "feedback": f"Esta semana completaste el {percent}% de tus tareas."
    }), 200
