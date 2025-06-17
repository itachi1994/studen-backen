from app import ma
from marshmallow import fields

class CommentSchema(ma.Schema):
    id = fields.Integer(dump_only=True)
    task_id = fields.Integer(required=True)
    user_id = fields.Integer(dump_only=True)
    content = fields.String(required=True)
    created_at = fields.DateTime()
