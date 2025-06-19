from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models.user import User
from app.models.user_schema import UserSchema
from flask_jwt_extended import create_access_token
from app.utils.university_scraper import get_study_plan_sima
from app.models.evento import Evento
from app.models.chat_message import ChatMessage
from app.models.task import Task
from app.models.subject import Subject
from datetime import datetime

auth_bp = Blueprint('auth', __name__)
user_schema = UserSchema()

# Registro
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    errors = user_schema.validate(data)
    # Exige campos de SIMA solo en el registro
    if not data.get("sima_username"):
        errors["sima_username"] = ["Missing data for required field."]
    if not data.get("sima_password"):
        errors["sima_password"] = ["Missing data for required field."]
    if errors:
        return jsonify(errors), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Este correo ya está registrado."}), 409

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        email=data['email'],
        password=hashed_password,
        sima_username=data['sima_username'],
        sima_password=data['sima_password']
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuario registrado exitosamente."}), 201

# Login
@auth_bp.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"message": "El cuerpo de la petición debe ser JSON"}), 400
    
    data = request.get_json()
    print("Login data received:", data)  # Debug

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email y password son requeridos"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "Email o password incorrectos"}), 401

    access_token = create_access_token(identity=str(user.id))
    
    # Sincronización con SIMA (si las credenciales son correctas)
    if user.sima_username and user.sima_password:
        try:
            eventos_sima = get_study_plan_sima(user.sima_username, user.sima_password)
            for ev in eventos_sima:
                # Verificar si el evento ya existe
                existe_evento = Evento.query.filter_by(
                    nombre=ev['nombre'],
                    dia=ev['dia'],
                    mes_ano=ev['mes_ano']
                ).first()
                if not existe_evento:
                    db.session.add(Evento(
                        nombre=ev['nombre'],
                        url=ev['url'],
                        dia=ev['dia'],
                        mes_ano=ev['mes_ano'],
                        curso_nombre=ev['curso_nombre']
                    ))
                
                # Crear materia si no existe
                subject = Subject.query.filter_by(name=ev['curso_nombre']).first()
                if not subject:
                    subject = Subject(name=ev['curso_nombre'], weekly_hours=2)
                    db.session.add(subject)
                    db.session.commit()
                
                # Determinar prioridad según el nombre del evento
                nombre_lower = ev['nombre'].lower()
                if "evaluación" in nombre_lower or "examen" in nombre_lower:
                    prioridad = "high"
                elif "protocolo" in nombre_lower or "actividad" in nombre_lower:
                    prioridad = "medium"
                else:
                    prioridad = "low"
                
                # Crear tarea si no existe para el usuario
                due_date = None
                try:
                    fecha_str = f"{ev['dia']} {ev['mes_ano']}"
                    due_date = datetime.strptime(fecha_str, "%d %B %Y")
                except Exception:
                    pass
                
                existe_tarea = Task.query.filter_by(
                    user_id=user.id,
                    title=ev['nombre'],
                    subjects_id=subject.id
                ).first()
                if not existe_tarea:
                    db.session.add(Task(
                        title=ev['nombre'],
                        description=f"Evento importado de SIMA: {ev['nombre']}",
                        due_date=due_date,
                        priority=prioridad,
                        status="pending",
                        user_id=user.id,
                        subjects_id=subject.id
                    ))
            db.session.commit()
        except Exception as e:
            print(f"Error ejecutando el scraper SIMA: {e}")

    return jsonify({
        "token": access_token,
        "email": user.email,
        "message": "Inicio de sesión exitoso."
    }), 200