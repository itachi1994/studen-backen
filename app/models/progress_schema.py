from app import ma
from marshmallow import fields

class ProgressReportSchema(ma.Schema):
    id         = fields.Integer(dump_only=True)
    period     = fields.String(required=True)
    report     = fields.String(required=True)
    created_at = fields.DateTime()
