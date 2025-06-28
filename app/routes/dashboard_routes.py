from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.task import Task
from datetime import datetime, timedelta
from app.models.evento import Evento
from app.models.subject import Subject
from sqlalchemy import extract
import calendar

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def academic_dashboard():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id).all()

    if not tasks:
        return jsonify({"message": "No hay suficientes datos para generar el panel"}), 400

    # Agrupar tareas por materia
    subject_stats = {}
    for task in tasks:
        subject_name = getattr(task, 'subject', None)
        if not subject_name and hasattr(task, 'subjects_id'):
            # Buscar el nombre de la materia
            from app.models.subject import Subject
            subj = Subject.query.filter_by(id=task.subjects_id).first()
            subject_name = subj.name if subj else "Materia desconocida"
        if subject_name not in subject_stats:
            subject_stats[subject_name] = {"total": 0, "done": 0, "pending": 0}
        subject_stats[subject_name]["total"] += 1
        if task.status == 'done':
            subject_stats[subject_name]["done"] += 1
        else:
            subject_stats[subject_name]["pending"] += 1

    course_stats = []
    total_done = 0
    total_tasks = 0
    for subject_name, stats in subject_stats.items():
        percent = int((stats["done"] / stats["total"]) * 100) if stats["total"] else 0
        course_stats.append({
            "course": subject_name,
            "total_tasks": stats["total"],
            "completed": stats["done"],
            "pending": stats["pending"],
            "progress": percent
        })
        total_done += stats["done"]
        total_tasks += stats["total"]

    overall_progress = int((total_done / total_tasks) * 100) if total_tasks else 0

    # Feedback automático
    if overall_progress >= 85:
        level = "Alto"
        advice = "¡Excelente! Sigue así, tu rendimiento es muy alto."
    elif overall_progress >= 60:
        level = "Medio"
        advice = "Vas bien, pero aún puedes mejorar la constancia."
    else:
        level = "Bajo"
        advice = "Te recomendamos organizar mejor tu tiempo de estudio."

    return jsonify({
        "total_courses": len(course_stats),
        "overall_progress": overall_progress,
        "performance_level": level,
        "advice": advice,
        "courses": course_stats
    }), 200

@dashboard_bp.route('/dashboard/summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    user_id = get_jwt_identity()
    now = datetime.utcnow()
    week_later = now + timedelta(days=7)

    # Tareas próximas y prioritarias (dentro de los próximos 7 días)
    tasks = Task.query.filter_by(user_id=user_id).filter(
        Task.status == 'pending',
        Task.due_date >= now,
        Task.due_date <= week_later
    ).order_by(Task.priority.desc(), Task.due_date.asc()).all()

    # 🔥 CAMBIO: Manejar caso sin tareas
    urgent_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "priority": t.priority
        }
        for t in tasks if t.priority == 'high'
    ]

    upcoming_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "priority": t.priority
        }
        for t in tasks
    ]

    # Eventos próximos: próximos 7 días, sin importar el mes/año
    eventos = []
    today = datetime.utcnow()
    for delta in range(0, 8):
        check_date = today + timedelta(days=delta)
        dia = str(check_date.day)
        mes_ano = check_date.strftime("%B %Y").lower()
        evs = Evento.query.filter(
            Evento.dia == dia,
            Evento.mes_ano.ilike(f"%{mes_ano}%")
        ).all()
        for e in evs:
            eventos.append({
                "nombre": e.nombre,
                "dia": e.dia,
                "mes_ano": e.mes_ano,
                "curso_nombre": e.curso_nombre,
                "url": e.url
            })

    # Log para depuración
    print(f"[DEBUG] user_id={user_id} tasks={len(tasks)} eventos={len(eventos)}")

    # Mensaje personalizado según el estado
    if not tasks and not eventos:
        message = "¡Bienvenido! Comienza creando tus primeras tareas y revisando tus eventos."
    elif not tasks:
        message = "No tienes tareas pendientes para los próximos 7 días. ¡Excelente trabajo!"
    elif not eventos:
        message = "Tienes tareas pendientes pero no hay eventos próximos registrados."
    else:
        message = "Aquí tienes un resumen de tus próximas actividades."

    return jsonify({
        "urgent_tasks": urgent_tasks,
        "upcoming_tasks": upcoming_tasks,
        "upcoming_events": eventos,
        "message": message,
        "debug_counts": {
            "urgent_tasks": len(urgent_tasks),
            "upcoming_tasks": len(upcoming_tasks),
            "upcoming_events": len(eventos)
        }
    }), 200

    # Eventos próximos: próximos 7 días, sin importar el mes/año
    eventos = []
    today = datetime.utcnow()
    for delta in range(0, 8):
        check_date = today + timedelta(days=delta)
        dia = str(check_date.day)
        mes_ano = check_date.strftime("%B %Y").lower()
        evs = Evento.query.filter(
            Evento.dia == dia,
            Evento.mes_ano.ilike(f"%{mes_ano}%")
        ).all()
        for e in evs:
            eventos.append({
                "nombre": e.nombre,
                "dia": e.dia,
                "mes_ano": e.mes_ano,
                "curso_nombre": e.curso_nombre,
                "url": e.url
            })

    # Log para depuración
    print(f"[DEBUG] user_id={user_id} tasks={len(tasks)} eventos={len(eventos)}")

    return jsonify({
        "urgent_tasks": urgent_tasks,
        "upcoming_tasks": upcoming_tasks,
        "upcoming_events": eventos,
        "debug_counts": {
            "urgent_tasks": len(urgent_tasks),
            "upcoming_tasks": len(upcoming_tasks),
            "upcoming_events": len(eventos)
        }
    }), 200

from flask import request

@dashboard_bp.route('/events', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_all_events():
    if request.method == 'OPTIONS':
        return '', 204

    mes = (request.args.get("mes") or "").strip().lower()
    ano = (request.args.get("ano") or "").strip()
    query = Evento.query

    if mes and ano:
        filtro_mes_ano = f"{mes} {ano}"
        query = query.filter(Evento.mes_ano.ilike(f"%{filtro_mes_ano}%"))
    elif mes:
        query = query.filter(Evento.mes_ano.ilike(f"%{mes}%"))
    elif ano:
        query = query.filter(Evento.mes_ano.ilike(f"%{ano}%"))

    eventos = query.order_by(Evento.mes_ano, Evento.dia).all()
    eventos_list = [
        {
            "nombre": e.nombre,
            "dia": e.dia,
            "mes_ano": e.mes_ano,
            "curso_nombre": e.curso_nombre,
            "url": e.url
        }
        for e in eventos
    ]
    return jsonify(eventos_list), 200

@dashboard_bp.route('/calendar/data', methods=['GET'])
@jwt_required()
def get_calendar_data():
    user_id = get_jwt_identity()
    
    # Obtener parámetros de fecha
    year = request.args.get('year', datetime.now().year, type=int)
    month = request.args.get('month', datetime.now().month, type=int)
    
    # Calcular rango del mes
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = datetime(year, month + 1, 1) - timedelta(days=1)
    
    # Obtener tareas del mes
    tasks = Task.query.filter(
        Task.user_id == user_id,
        Task.due_date >= start_date,
        Task.due_date <= end_date + timedelta(days=1)
    ).all()
    
    # Obtener materias del usuario
    from app.models.subject import Subject
    subjects = Subject.query.filter_by(user_id=user_id).all()
    subjects_dict = {s.id: s for s in subjects}
    
    # Obtener eventos del mes
    mes_nombre = calendar.month_name[month].lower()
    eventos = Evento.query.filter(
        Evento.mes_ano.ilike(f"%{mes_nombre} {year}%")
    ).all()
    
    # Organizar datos por día
    calendar_data = {}
    
    # Agregar tareas
    for task in tasks:
        if task.due_date:
            day = task.due_date.day
            if day not in calendar_data:
                calendar_data[day] = {"tasks": [], "events": [], "subjects": []}
            
            subject_name = "Sin materia"
            subject_color = "#667eea"
            if task.subjects_id and task.subjects_id in subjects_dict:
                subject_name = subjects_dict[task.subjects_id].name
                subject_color = getattr(subjects_dict[task.subjects_id], 'color', '#667eea')
            
            calendar_data[day]["tasks"].append({
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "status": task.status,
                "subject_id": task.subjects_id,
                "subject_name": subject_name,
                "subject_color": subject_color,
                "time": task.due_date.strftime("%H:%M") if task.due_date else None
            })
    
    # Agregar eventos
    for evento in eventos:
        try:
            day = int(evento.dia)
            if day not in calendar_data:
                calendar_data[day] = {"tasks": [], "events": [], "subjects": []}
            
            calendar_data[day]["events"].append({
                "nombre": evento.nombre,
                "curso": evento.curso_nombre,
                "url": evento.url
            })
        except (ValueError, TypeError):
            continue
    
    # Información de materias para mostrar horarios de estudio
    subjects_info = []
    for subject in subjects:
        subjects_info.append({
            "id": subject.id,
            "name": subject.name,
            "code": subject.code,
            "professor": subject.professor,
            "credits": subject.credits,
            "difficulty": subject.difficulty,
            "weekly_hours": subject.weekly_hours,
            "color": getattr(subject, 'color', f"hsl({hash(subject.name) % 360}, 70%, 50%)")
        })
    
    return jsonify({
        "month": month,
        "year": year,
        "calendar_data": calendar_data,
        "subjects": subjects_info,
        "total_tasks": len(tasks),
        "total_events": len(eventos)
    }), 200
