from app import db
from datetime import datetime

class PlanningPreferences(db.Model):
    __tablename__ = 'planning_preferences'

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    max_daily_hours = db.Column(db.Integer, nullable=False, default=4)
    preferred_days  = db.Column(db.String(120))  # ej: "lunes,martes,jueves"
    rest_days       = db.Column(db.String(120))  # ej: "domingo"
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("planning_preferences", uselist=False))
