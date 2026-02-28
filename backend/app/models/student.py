"""
Student model links to a User entry and optionally to a Class.
Now supports face recognition encoding storage.
"""
from datetime import datetime
from ..extensions import db


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    roll_no = db.Column(db.String(50))
    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.id", ondelete="SET NULL")
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    

    # FACE REGISTRATION FIELDS
    face_image_path = db.Column(db.String(255), nullable=True)
    face_registered_at = db.Column(db.DateTime, nullable=True)

    face_embedding = db.Column(db.Text, nullable=True)

    user = db.relationship(
        "User",
        backref=db.backref("student_profile", uselist=False)
    )

    klass = db.relationship(
        "Class",
        backref=db.backref("students", lazy="dynamic")
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user": self.user.to_dict() if self.user else None,
            "roll_no": self.roll_no,
            "class_id": self.class_id,
            "face_registered": self.face_image_path is not None,
            "face_registered_at": self.face_registered_at.isoformat()
            if self.face_registered_at else None
        }