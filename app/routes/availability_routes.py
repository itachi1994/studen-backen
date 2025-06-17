from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.availability import Availability
from app.models.availability_schema import AvailabilitySchema

availability_bp = Blueprint('availability', __name__)
avail_schema = AvailabilitySchema()
avail_many_schema = AvailabilitySchema(many=True)

@availability_bp.route('/availability', methods=['POST'])
@jwt_required()
def create_availability():
    user_id = get_jwt_identity()
    data = request.get_json()
    errors = avail_schema.validate(data)
    if errors:
        return jsonify(errors), 400

    new_block = Availability(user_id=user_id, **data)
    db.session.add(new_block)
    db.session.commit()
    return avail_schema.jsonify(new_block), 201


@availability_bp.route('/availability/<int:block_id>', methods=['PUT'])
@jwt_required()
def update_availability(block_id):
    user_id = get_jwt_identity()
    block = Availability.query.filter_by(id=block_id, user_id=user_id).first_or_404()
    data = request.get_json()
    errors = avail_schema.validate(data)
    if errors:
        return jsonify(errors), 400

    for key, value in data.items():
        setattr(block, key, value)
    db.session.commit()
    return avail_schema.jsonify(block)


@availability_bp.route('/availability/<int:block_id>', methods=['DELETE'])
@jwt_required()
def delete_availability(block_id):
    user_id = get_jwt_identity()
    block = Availability.query.filter_by(id=block_id, user_id=user_id).first_or_404()
    db.session.delete(block)
    db.session.commit()
    return jsonify({"message": "Bloque eliminado"}), 200


@availability_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    user_id = get_jwt_identity()
    blocks = Availability.query.filter_by(user_id=user_id).all()
    return avail_many_schema.jsonify(blocks), 200
