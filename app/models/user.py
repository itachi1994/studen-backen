from app import db
from datetime import datetime
from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Credenciales SIMA
    sima_username = db.Column(db.String(100))
    sima_password = db.Column(db.String(100))

    tasks = db.relationship('Task', back_populates='user')
