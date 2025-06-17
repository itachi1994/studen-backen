from app import ma
from marshmallow import fields, validate

class HabitSchema(ma.Schema):
    preferred_block_minutes = fields.Integer(required=True, validate=validate.Range(min=20, max=180))
    early_bird              = fields.Boolean(required=True)
    distractions            = fields.String(required=False, allow_none=True, validate=validate.Length(max=250))
    study_location          = fields.String(required=False, allow_none=True)
