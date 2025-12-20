# app/__init__.py

from flask import Flask, jsonify, request
from .extensions import db, migrate, jwt, cors
from .config import config_by_name


def create_app(config_name: str = "default"):
    app = Flask(__name__, static_folder="../static", template_folder="../templates")

    config_obj = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(config_obj)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    cors.init_app(
    app,
    resources={r"/api/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    )
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return "", 200

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"success": True, "message": "Backend running"})

    # Blueprints
    from .blueprints.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from .blueprints.admin.routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    from .blueprints.teacher.routes import teacher_bp
    app.register_blueprint(teacher_bp, url_prefix="/api/teacher")

    from .blueprints.student.routes import student_bp
    app.register_blueprint(student_bp, url_prefix="/api/student")

    from .blueprints.reports.routes import reports_bp
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    from .utils.errors import APIError, handle_api_error, handle_generic_exception
    app.register_error_handler(APIError, lambda e: handle_api_error(e))
    app.register_error_handler(Exception, lambda e: handle_generic_exception(e))

    return app
