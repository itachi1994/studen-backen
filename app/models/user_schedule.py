from app import db
from datetime import datetime

class UserSchedule(db.Model):
    __tablename__ = 'user_schedules'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    schedule_json = db.Column(db.Text, nullable=False)  # Guarda el horario como JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("schedules", lazy=True))
