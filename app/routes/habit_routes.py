from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.habit import StudyHabitSurvey
from app.models.habit_schema import HabitSchema

habit_bp   = Blueprint('habit', __name__)
habit_schema = HabitSchema()

@habit_bp.route('/habit', methods=['POST','PUT'])
@jwt_required()
def create_or_update_habit():
    user_id = get_jwt_identity()
    data = request.get_json()
    errors = habit_schema.validate(data)
    if errors:
        return jsonify(errors), 400

    survey = StudyHabitSurvey.query.filter_by(user_id=user_id).first()
    if survey:
        for k,v in data.items(): setattr(survey, k, v)
    else:
        survey = StudyHabitSurvey(user_id=user_id, **data)
        db.session.add(survey)

    db.session.commit()
    return habit_schema.jsonify(survey), 200

@habit_bp.route('/habit', methods=['GET'])
@jwt_required()
def get_habit():
    user_id = get_jwt_identity()
    survey = StudyHabitSurvey.query.filter_by(user_id=user_id).first()
    if not survey:
        return jsonify({"message":"No survey found"}), 404
    return habit_schema.jsonify(survey)
