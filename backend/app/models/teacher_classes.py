"""
TeacherClass mapping: links a teacher to a class (many-to-many via explicit table).
"""
from ..extensions import db

class TeacherClass(db.Model):
    __tablename__ = "teacher_classes"

    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)

    teacher = db.relationship("Teacher", backref=db.backref("teacher_classes", cascade="all,delete-orphan"))
    klass = db.relationship("Class", backref=db.backref("teacher_classes", cascade="all,delete-orphan"))

    def to_dict(self):
        return {"id": self.id, "teacher_id": self.teacher_id, "class_id": self.class_id}
