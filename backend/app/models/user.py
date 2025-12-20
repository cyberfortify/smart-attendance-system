"""
User model: base class for Admin/Teacher/Student identities.
Password is stored hashed using werkzeug utilities.
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("ADMIN", "TEACHER", "STUDENT"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, raw_password: str) -> None:
        """Hash and set the user's password."""
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        """Verify a raw password against the stored hash."""
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self) -> dict:
        """Return basic user info as a dict (exclude password hash)."""
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}

    def __repr__(self):
        return f"<User {self.id} {self.email} {self.role}>"
