from app import ma
from marshmallow import fields

class UserScheduleSchema(ma.Schema):
    id = fields.Integer(dump_only=True)
    user_id = fields.Integer()
    schedule_json = fields.String(required=True)
    created_at = fields.DateTime()
