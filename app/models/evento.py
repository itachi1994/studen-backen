from app.extensions import db

class Evento(db.Model):
    __tablename__ = 'evento'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255))
    url = db.Column(db.String(255))
    dia = db.Column(db.String(10))
    mes_ano = db.Column(db.String(30))  # Aumenta tamaño para meses largos
    curso_nombre = db.Column(db.String(255))