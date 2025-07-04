from marshmallow import Schema, fields, validate

class UserProfileSchema(Schema):
    class Meta:
        fields = ('full_name', 'university', 'academic_program', 
                 'current_semester', 'enrollment_number', 'phone',
                 'sima_username', 'sima_password')
    
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    university = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    academic_program = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    current_semester = fields.Int(required=True, validate=validate.Range(min=1, max=20))
    enrollment_number = fields.Str(validate=validate.Length(max=50))
    phone = fields.Str(validate=validate.Length(max=20))
    sima_username = fields.Str(required=False, allow_none=True)
    sima_password = fields.Str(required=False, allow_none=True, load_only=True)