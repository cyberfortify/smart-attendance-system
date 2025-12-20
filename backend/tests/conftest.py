"""
Pytest fixtures: a temporary in-memory SQLite app for unit tests.
This isolates tests from your MySQL dev DB.
"""
import pytest
from app import create_app
from app.extensions import db

@pytest.fixture
def app():
    app = create_app("default")
    # override DB URI to in-memory sqlite for tests
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["TESTING"] = True
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()
