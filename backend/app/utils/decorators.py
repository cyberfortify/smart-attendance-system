"""
Role-check decorators for endpoints.
Provides `role_required` decorator which verifies JWT and required role.
"""
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def role_required(*allowed_roles):
    """
    Decorator to allow access only to users with specified roles.
    Usage:
        @role_required('ADMIN')
        @role_required('TEACHER', 'ADMIN')
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):

            # ✅ VERY IMPORTANT: allow CORS preflight
            if request.method == "OPTIONS":
                return "", 200

            # ✅ Verify JWT only for real requests
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")

            if role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "error": "Forbidden: insufficient role"
                }), 403

            return fn(*args, **kwargs)

        return wrapper
    return decorator
