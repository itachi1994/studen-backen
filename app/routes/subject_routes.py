from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.subject import Subject
from app.models.subject_schema import SubjectSchema

subject_bp = Blueprint('subject', __name__)
sub_schema = SubjectSchema()
sub_many  = SubjectSchema(many=True)

@subject_bp.route('/subjects', methods=['POST'])
@jwt_required()
def create_subject():
    user_id = get_jwt_identity()
    data = request.get_json()
    errors = sub_schema.validate(data)
    if errors: return jsonify(errors), 400

    subj = Subject(user_id=user_id, **data)
    db.session.add(subj); db.session.commit()
    return sub_schema.jsonify(subj), 201

@subject_bp.route('/subjects', methods=['GET'])
@jwt_required()
def list_subjects():
    user_id = get_jwt_identity()
    subjects = Subject.query.filter_by(user_id=user_id).all()
    return sub_many.jsonify(subjects)

@subject_bp.route('/subjects/<int:sid>', methods=['PUT','DELETE'])
@jwt_required()
def modify_subject(sid):
    user_id = get_jwt_identity()
    subj = Subject.query.filter_by(id=sid, user_id=user_id).first_or_404()

    if request.method == 'PUT':
        data = request.get_json()
        errors = sub_schema.validate(data); 
        if errors: return jsonify(errors), 400
        for k,v in data.items(): setattr(subj,k,v)
        db.session.commit()
        return sub_schema.jsonify(subj)
    else:
        db.session.delete(subj); db.session.commit()
        return jsonify({"message":"Materia eliminada"}), 200
