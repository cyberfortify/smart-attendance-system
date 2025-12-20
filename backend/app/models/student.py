"""
Student model links to a User entry and optionally to a Class.
"""
from ..extensions import db


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    roll_no = db.Column(db.String(50))
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="SET NULL"))

    user = db.relationship("User", backref=db.backref("student_profile", uselist=False))
    klass = db.relationship("Class", backref=db.backref("students", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "user": self.user.to_dict() if self.user else None,
            "roll_no": self.roll_no,
            "class_id": self.class_id,
        }

    def __repr__(self):
        return f"<Student {self.id} user_id={self.user_id}>"
