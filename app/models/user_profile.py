from app import db
from app.models.user import User
from app.extensions import db

class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    university = db.Column(db.String(100), nullable=False)
    academic_program = db.Column(db.String(100), nullable=False)
    current_semester = db.Column(db.Integer, nullable=False)
    enrollment_number = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    # Campos para SIMA
    sima_username = db.Column(db.String(100))
    sima_password = db.Column(db.String(100))
    
    # Relación
    user = db.relationship('User', backref=db.backref('profile', uselist=False))
    
    def __repr__(self):
        return f'<UserProfile {self.full_name}>'