from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models.user import User
from app.models.user_schema import UserSchema
from flask_jwt_extended import create_access_token
from flask import current_app
from app.extensions import db, bcrypt 

auth_bp = Blueprint('auth', __name__)
user_schema = UserSchema()

#  Registro
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    errors = user_schema.validate(data)
    if errors:
        return jsonify(errors), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"message": "Este correo ya está registrado."}), 409

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(email=data['email'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuario registrado exitosamente."}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    print("DEBUG - App context:", current_app.name)

    user = User.query.filter_by(email=data['email']).first()

    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"message": "Correo o contraseña inválidos."}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": access_token,
        "email": user.email,
        "message": "Inicio de sesión exitoso."
    })
