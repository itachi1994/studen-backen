from app import db
from datetime import datetime

class Subject(db.Model):
    __tablename__ = 'subjects'

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name        = db.Column(db.String(120), nullable=False)
    code        = db.Column(db.String(30))
    professor   = db.Column(db.String(120))
    credits     = db.Column(db.Integer)
    difficulty  = db.Column(db.Integer, default=3)  # 1‑5
    priority    = db.Column(db.Integer, default=3)  # Opcional
    weekly_hours= db.Column(db.Integer)             # Opcional
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    color       = db.Column(db.String(20))          # Nuevo campo para color

    user = db.relationship("User", backref=db.backref("subjects", cascade="all,delete"))
