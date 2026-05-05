from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from bson.errors import InvalidId
import re
from extensions import mongo

auth_bp = Blueprint("auth", __name__)

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength (min 8 chars, at least 1 uppercase, 1 number)."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not any(char.isupper() for char in password):
        return False, "Password must contain at least 1 uppercase letter"
    if not any(char.isdigit() for char in password):
        return False, "Password must contain at least 1 number"
    return True, "Valid"

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        # Validate JSON data exists
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        email = data.get("email", "").strip()
        password = data.get("password", "")
        name = data.get("name", "").strip()

        # Input validation
        if not email or not password or not name:
            return jsonify({"error": "Email, password, and name are required"}), 400
        
        if len(name) < 2:
            return jsonify({"error": "Name must be at least 2 characters"}), 400
        
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        is_valid, pwd_msg = validate_password(password)
        if not is_valid:
            return jsonify({"error": pwd_msg}), 400

        # Check if email already exists
        existing_user = mongo.db.users.find_one({"email": email.lower()})
        if existing_user:
            return jsonify({"error": "Email already registered"}), 409

        # Hash password and insert user
        hashed_pw = generate_password_hash(password)
        result = mongo.db.users.insert_one({
            "email": email.lower(),
            "password": hashed_pw,
            "name": name,
            "created_at": __import__('datetime').datetime.utcnow()
        })
        
        return jsonify({
            "message": "User registered successfully",
            "user_id": str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({"error": "Registration failed", "details": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        # Validate JSON data exists
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Input validation
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Find user by email
        user = mongo.db.users.find_one({"email": email})
        
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Verify password
        if not check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid credentials"}), 401

        # Create JWT token (store user_id as string)
        token = create_access_token(identity=str(user["_id"]))
        
        return jsonify({
            "token": token,
            "name": user["name"],
            "email": user["email"],
            "user_id": str(user["_id"])
        }), 200

    except Exception as e:
        return jsonify({"error": "Login failed", "details": str(e)}), 500

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    try:
        # Get user_id from JWT token (it's a string)
        user_id = get_jwt_identity()
        
        # Convert string to ObjectId for MongoDB query
        try:
            user_obj_id = ObjectId(user_id)
        except InvalidId:
            return jsonify({"error": "Invalid user ID"}), 401
        
        # Query MongoDB with proper ObjectId
        user = mongo.db.users.find_one({"_id": user_obj_id}, {"password": 0})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Convert ObjectId to string for JSON response
        user["_id"] = str(user["_id"])
        
        return jsonify({"user": user}), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch user", "details": str(e)}), 500