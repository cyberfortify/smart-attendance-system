"""
Centralized error types and error handler utilities.
Define custom exceptions and helper to convert exceptions to JSON responses.
"""
from typing import Any, Dict
from flask import jsonify, request


class APIError(Exception):
    """
    Generic API error.
    Use to raise controlled errors with an HTTP status code.
    """
    def __init__(self, message: str, status_code: int = 400, payload: Dict[str, Any] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}

    def to_dict(self):
        rv = dict(self.payload)
        rv["error"] = self.message
        return rv


def handle_api_error(error):
    if request.method == "OPTIONS":
        return "", 200

    response = {
        "success": False,
        "error": error.message,
    }
    return jsonify(response), error.status_code


def handle_generic_exception(error):
    if request.method == "OPTIONS":
        return "", 200

    print("Unhandled exception:", error)
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500
