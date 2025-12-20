"""
Simple request JSON validation helpers.
Provides a decorator `validate_json` that checks required fields and their types.
This is intentionally lightweight (no Marshmallow dependency) but can be replaced by Marshmallow later.
Usage:
    @validate_json({"class_id": int, "session_date": "date"})
    def endpoint():
        ...
Supported types: int, str, float, bool, "date" (YYYY-MM-DD)
"""
from functools import wraps
from datetime import datetime
from flask import request, jsonify
from .errors import APIError


def _check_type(value, expected_type):
    if expected_type == int:
        return isinstance(value, int)
    if expected_type == str:
        return isinstance(value, str)
    if expected_type == float:
        return isinstance(value, float) or isinstance(value, int)
    if expected_type == bool:
        return isinstance(value, bool)
    if expected_type == "date":
        if not isinstance(value, str):
            return False
        try:
            datetime.strptime(value, "%Y-%m-%d")
            return True
        except ValueError:
            return False
    # unknown expected_type, skip check
    return True


def validate_json(schema: dict):
    """
    Decorator to validate JSON body contains required fields per schema.
    schema: dict mapping field_name -> expected_type (int, str, float, bool, "date")
    If a field is optional, use None as expected_type.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            data = request.get_json(silent=True)
            if data is None:
                raise APIError("Request body must be JSON", status_code=400)
            for field, expected in schema.items():
                if expected is None:
                    # optional field — skip existence check
                    continue
                if field not in data:
                    raise APIError(f"Missing required field: {field}", status_code=400)
                if expected and not _check_type(data[field], expected):
                    raise APIError(f"Field '{field}' must be of type {expected}", status_code=400)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
