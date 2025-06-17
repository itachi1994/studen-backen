from flask import Blueprint, request, jsonify
from app.utils.university_scraper import get_study_plan_sima

university_bp = Blueprint('university', __name__)

@university_bp.route('/import-sima', methods=['POST'])
def import_sima():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Usuario y contraseña requeridos'}), 400
    try:
        plan = get_study_plan_sima(username, password)
        return jsonify(plan)
    except Exception as e:
        return jsonify({'error': str(e)}), 500