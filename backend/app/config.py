"""
Configuration classes for Flask application.
Adjust values using environment variables in production.
"""
import os

basedir = os.path.abspath(os.path.dirname(__file__))


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change_me")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change_me_jwt")


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "SQLALCHEMY_DATABASE_URI",
        "mysql+mysqlconnector://root:root@localhost/attendance_system",
    )


config_by_name = {"development": DevelopmentConfig, "default": DevelopmentConfig}
