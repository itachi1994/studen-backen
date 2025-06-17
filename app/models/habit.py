from app import db
from datetime import datetime

class StudyHabitSurvey(db.Model):
    __tablename__ = 'habit_surveys'

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    preferred_block_minutes = db.Column(db.Integer, default=50)   # largo ideal de sesión
    early_bird    = db.Column(db.Boolean)   # True = mañanas, False = noches
    distractions  = db.Column(db.String(250))  # texto libre
    study_location= db.Column(db.String(120))  # casa, biblioteca, etc.
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("habit", uselist=False))
