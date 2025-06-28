from flask import Flask
from flask_cors import CORS
from flask_mail import Mail
from apscheduler.schedulers.background import BackgroundScheduler
from .config import Config
from .extensions import db, migrate, jwt, mail


from .config import Config
from .extensions import db, bcrypt, ma, jwt, migrate
from .extensions import db, bcrypt, ma, jwt, migrate, mail


from app.routes.availability_routes import availability_bp
from app.routes.subject_routes import subject_bp
from app.routes.habit_routes import habit_bp
from app.routes.planning_routes import planning_bp
from app.routes.task_routes import task_bp
from app.routes.suggestion_routes import suggestion_bp
from app.routes.progress_routes import progress_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.calendar_routes import calendar_bp
from app.routes.university_routes import university_bp
from app.models.evento import Evento
from app import models 
from app.routes.user_extra_routes import user_extra_bp


mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar extensiones
    db.init_app(app)
    bcrypt.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    # Configurar CORS para permitir solo el frontend
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

    # Importar modelos después de inicializar extensiones (para evitar importación circular)
    from app.models.task import Task
    from app.models.user import User
    from app.models.user_profile import UserProfile

    # Inicializar APScheduler después de importar modelos
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=Task.send_task_reminders, trigger="interval", hours=24)
    scheduler.start()

    # Registrar blueprints
    app.register_blueprint(availability_bp, url_prefix='/api')
    app.register_blueprint(subject_bp, url_prefix='/api')
    app.register_blueprint(habit_bp, url_prefix='/api')
    app.register_blueprint(planning_bp, url_prefix='/api')
    app.register_blueprint(task_bp, url_prefix='/api')
    app.register_blueprint(suggestion_bp, url_prefix='/api')
    app.register_blueprint(progress_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(calendar_bp, url_prefix='/api')
    app.register_blueprint(university_bp, url_prefix='/api/university')
    app.register_blueprint(user_extra_bp, url_prefix='/api')

    from app.routes.auth_routes import auth_bp
    from app.routes.profile_routes import profile_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api')

    return app
