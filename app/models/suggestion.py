from app import db
from datetime import datetime

class WeeklySuggestion(db.Model):
    __tablename__ = 'weekly_suggestions'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content    = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("suggestions", lazy=True))
