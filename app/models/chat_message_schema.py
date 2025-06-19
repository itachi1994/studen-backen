from app import ma
from marshmallow import fields

class ChatMessageSchema(ma.Schema):
    id = fields.Integer(dump_only=True)
    user_id = fields.Integer()
    sender = fields.String()
    message = fields.String()
    created_at = fields.DateTime()
