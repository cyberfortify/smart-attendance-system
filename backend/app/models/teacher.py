"""
Teacher model links to a User entry. A teacher can be assigned to multiple classes.
"""
from ..extensions import db


class Teacher(db.Model):
    __tablename__ = "teachers"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    employee_id = db.Column(db.String(50))

    user = db.relationship("User", backref=db.backref("teacher_profile", uselist=False))

    def to_dict(self):
        return {"id": self.id, "user": self.user.to_dict() if self.user else None, "employee_id": self.employee_id}

    def __repr__(self):
        return f"<Teacher {self.id} user_id={self.user_id}>"
