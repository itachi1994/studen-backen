from app import ma
from marshmallow import fields, validate

class PlanningSchema(ma.Schema):
    max_daily_hours = fields.Integer(required=True, validate=validate.Range(min=1, max=12))
    preferred_days  = fields.String(required=False, allow_none=True)
    rest_days       = fields.String(required=False, allow_none=True)
