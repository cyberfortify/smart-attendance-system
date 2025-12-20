"""
Authentication helper functions. Keep auth-related logic here.
This module is intentionally small for the starter app.
"""
import secrets
import string
from ..extensions import db
from ..models.user import User


def _generate_password(length: int = 12) -> str:
    """Return a reasonably strong random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_user(name: str, email: str, password: str = None, role: str = "STUDENT") -> User:
    """
    Create and persist a new user. Caller should commit the session.

    If password is None or empty, a secure random password will be generated
    and used (so set_password is never called with None).
    """
    if not password:
        password = _generate_password()

    user = User(name=name, email=email, role=role)
    # ensure set_password receives a string
    user.set_password(password)
    db.session.add(user)
    return user
