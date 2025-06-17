from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.models.availability import Availability
from app.models.subject import Subject
from app.models.planning import PlanningPreferences
from app.models.habit import StudyHabitSurvey
from app.utils.deepseek_api import generate_schedule_with_deepseek
import json

calendar_bp = Blueprint('calendar', __name__)

def build_deepseek_prompt(subjects, availability, prefs, habit):
    subject_list = [
        {
            "name": s.name,
            "weekly_hours": s.weekly_hours
        } for s in subjects if s.weekly_hours
    ]
    avail_list = [a.serialize() for a in availability]
    prefs_dict = {
        "max_daily_hours": prefs.max_daily_hours if prefs else 4,
        "preferred_days": prefs.preferred_days if prefs else "Monday,Tuesday,Wednesday,Thursday,Friday",
        "rest_days": prefs.rest_days if prefs else "Sunday"
    }
    habit_dict = {
        "preferred_block_minutes": habit.preferred_block_minutes if habit else 50,
        "early_bird": habit.early_bird if habit else True,
        "distractions": habit.distractions if habit else "",
        "study_location": habit.study_location if habit else ""
    }
    prompt = (
        "Eres un asistente que organiza horarios de estudio. "
        "Distribuye las horas semanales de cada materia en los bloques de disponibilidad del usuario, "
        "respetando sus preferencias y hábitos. No pongas más de las horas máximas diarias. "
        "Devuelve el resultado en formato JSON: "
        "{\"Monday\": [{\"subject\": \"Matemáticas\", \"block\": \"08:00-10:00\"}], ...}\n\n"
        f"Materias: {json.dumps(subject_list, ensure_ascii=False)}\n"
        f"Disponibilidad: {json.dumps(avail_list, ensure_ascii=False)}\n"
        f"Preferencias: {json.dumps(prefs_dict, ensure_ascii=False)}\n"
        f"Hábitos: {json.dumps(habit_dict, ensure_ascii=False)}"
    )
    return prompt

@calendar_bp.route('/calendar/fullweek', methods=['GET'])
@jwt_required()
def get_full_week_schedule():
    user_id = get_jwt_identity()

    subjects = Subject.query.filter_by(user_id=user_id).all()
    availability = Availability.query.filter_by(user_id=user_id).all()
    prefs = PlanningPreferences.query.filter_by(user_id=user_id).first()
    habit = StudyHabitSurvey.query.filter_by(user_id=user_id).first()

    if not subjects or not availability:
        return jsonify([])

    prompt = build_deepseek_prompt(subjects, availability, prefs, habit)
    try:
        response = generate_schedule_with_deepseek(prompt)
        start = response.find('{')
        end = response.rfind('}') + 1
        schedule_json = response[start:end]
        schedule = json.loads(schedule_json)
    except Exception as e:
        return jsonify({"error": f"Error generando horario: {str(e)}"}), 500

    events = []
    for day, blocks in schedule.items():
        for idx, block in enumerate(blocks):
            subject_name = block.get("subject") or block.get("title") or "Materia"
            block_time = block.get("block")
            if not block_time:
                continue
            try:
                start_hour, end_hour = block_time.split('-')
                days_of_week = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
                today = datetime.utcnow()
                today_idx = today.weekday()
                target_idx = days_of_week.index(day)
                diff = (target_idx - today_idx) % 7
                date = today + timedelta(days=diff)
                date = date.replace(hour=0, minute=0, second=0, microsecond=0)
                start_h, start_m = map(int, start_hour.split(':'))
                end_h, end_m = map(int, end_hour.split(':'))
                start_dt = date.replace(hour=start_h, minute=start_m)
                end_dt = date.replace(hour=end_h, minute=end_m)
                events.append({
                    "id": f"{day}-{idx}-{subject_name}",
                    "title": subject_name,
                    "start": start_dt.isoformat(),
                    "end": end_dt.isoformat(),
                    "allDay": False,
                    "type": "study"
                })
            except Exception:
                continue

    return jsonify(events)

@calendar_bp.route('/calendar/export/google', methods=['GET'])
@jwt_required()
def export_to_google_calendar():
    """
    Exporta los eventos de la semana a Google Calendar (estructura básica).
    """
    user_id = get_jwt_identity()
    # Aquí solo se prepara el payload, la integración real requiere OAuth y Google API.
    from app.models.user_schedule import UserSchedule
    import json
    schedule_obj = UserSchedule.query.filter_by(user_id=user_id).order_by(UserSchedule.created_at.desc()).first()
    if not schedule_obj:
        return jsonify({"message": "No hay horario para exportar"}), 404
    schedule = schedule_obj.schedule_json
    if isinstance(schedule, str):
        schedule = json.loads(schedule)
    events = []
    for day, blocks in schedule.items():
        for block in blocks:
            events.append({
                "summary": block.get("title") or block.get("subject"),
                "start": block.get("block"),
                "day": day
            })
    return jsonify({"google_calendar_events": events}), 200
