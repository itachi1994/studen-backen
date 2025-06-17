from app import ma
from marshmallow import fields, validate

class TaskSchema(ma.Schema):
    id            = fields.Integer(dump_only=True)
    title         = fields.String(required=True, validate=validate.Length(min=1, max=150))
    description   = fields.String(allow_none=True)
    due_date      = fields.DateTime(required=True)
    priority      = fields.String(validate=validate.OneOf(['low', 'medium', 'high']), allow_none=True)
    status        = fields.String(validate=validate.OneOf(['pending', 'done']), load_default='pending')
    created_at    = fields.DateTime()

    subjects_id    = fields.Integer(required=True)

    reminder_date  = fields.DateTime(allow_none=True)
    reminder_sent  = fields.Boolean(dump_only=True)

    user_id        = fields.Integer(dump_only=True)
    user_id        = fields.Integer(dump_only=True)
