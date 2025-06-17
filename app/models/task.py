from flask_mail import Message
from app.extensions import mail, db 
from datetime import datetime

class Task(db.Model):
    __tablename__ = 'task'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    description = db.Column(db.String(255))
    due_date = db.Column(db.DateTime)
    reminder_date = db.Column(db.DateTime, nullable=True)
    reminder_sent = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(10), nullable=True)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    subjects_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)  # ForeignKey agregado

    user = db.relationship('User', back_populates="tasks")

    @staticmethod
    def send_email_reminder(recipient_email, subject, body):
        from flask import current_app
        msg = Message(subject,
                      sender=current_app.config.get("MAIL_DEFAULT_SENDER"),
                      recipients=[recipient_email])
        msg.body = body
        try:
            mail.send(msg)
            print(f"Email sent to {recipient_email}")
        except Exception as e:
            print(f"Error sending email: {e}")

    @staticmethod
    def send_task_reminders():
        tasks = Task.query.filter(
            Task.reminder_date <= datetime.now(),
            Task.status == "pending",
            Task.reminder_sent == False
        ).all()

        for task in tasks:
            subject = f"Recordatorio: {task.title}"
            body = (
                f"¡Hola! No olvides completar la tarea: {task.title}.\n\n"
                f"Descripción: {task.description}\n"
                f"Fecha de vencimiento: {task.due_date.strftime('%Y-%m-%d') if task.due_date else ''}"
            )
            if task.user and hasattr(task.user, "email"):
                Task.send_email_reminder(task.user.email, subject, body)
            task.reminder_sent = True
        db.session.commit()
