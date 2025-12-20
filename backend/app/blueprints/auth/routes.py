"""
Authentication blueprint routes.
Implements POST /login which returns a JWT token on success.
Input JSON is validated using validate_json decorator.
"""
from flask import request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.exceptions import BadRequest
from ...models.user import User
from . import auth_bp
from ...utils.validators import validate_json
from ...utils.errors import APIError


@auth_bp.route("/login", methods=["POST"])
@validate_json({"email": str, "password": str})
def login():
    """
    Login endpoint. Expects JSON body: { "email": str, "password": str }
    Returns JSON: { success: True, data: { access_token, user } } on success.
    """
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        # Use APIError to trigger centralized handler with consistent JSON format
        raise APIError("Invalid credentials", status_code=401)

    # Create JWT token: use string identity to avoid "Subject must be a string" errors.
    additional_claims = {"role": user.role}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

    return jsonify({"success": True, "data": {"access_token": access_token, "user": user.to_dict()}})
