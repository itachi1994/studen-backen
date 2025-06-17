from app import ma
from marshmallow import fields, validate

class AvailabilitySchema(ma.Schema):
    day_of_week = fields.String(required=True,
                                validate=validate.OneOf(
                                    ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]))
    start_time = fields.Time(required=True, format="%H:%M")
    end_time   = fields.Time(required=True, format="%H:%M")
