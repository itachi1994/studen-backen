from app import ma
from marshmallow import fields

class SuggestionSchema(ma.Schema):
    id         = fields.Integer(dump_only=True)
    content    = fields.String(required=True)
    created_at = fields.DateTime()
