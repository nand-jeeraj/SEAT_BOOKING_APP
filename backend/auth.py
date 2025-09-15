from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from user import DummyUser
from pymongo import MongoClient
import os



auth_bp = Blueprint("auth", __name__)

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME_login")]

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password required'}), 400

    user = db.users.find_one({"email": email})
    if user and check_password_hash(user["password"], password):
        login_user(DummyUser(user["_id"]))
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'name': user.get('name'),
            'role': user.get('role', 'student'),
            'user_id': str(user["_id"]),
            'colid': user.get('colid'),
            'token': "dummy-session-token"  
        }), 200

    return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

@auth_bp.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify({"success": True})

@auth_bp.route("/check-auth")
def check_auth():
    if current_user.is_authenticated:
        return jsonify({"status": "ok"})
    return jsonify({"status": "unauthorized"}), 401
