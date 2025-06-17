from app import db
from datetime import datetime

class ProgressReport(db.Model):
    __tablename__ = 'progress_reports'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    period     = db.Column(db.String(10))  # 'weekly' o 'monthly'
    report     = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("progress_reports", lazy=True))
