from ..extensions import db


class TeacherSubjectAssignment(db.Model):
    __tablename__ = "teacher_subject_assignments"

    id = db.Column(db.Integer, primary_key=True)

    teacher_id = db.Column(
        db.Integer,
        db.ForeignKey("teachers.id"),
        nullable=False
    )

    class_id = db.Column(
        db.Integer,
        db.ForeignKey("classes.id"),
        nullable=False
    )

    subject_id = db.Column(
        db.Integer,
        db.ForeignKey("subjects.id"), 
        nullable=False
    )

    teacher = db.relationship("Teacher", backref="subject_assignments")
    subject = db.relationship("Subject", backref="teacher_assignments")

    def to_dict(self):
        return {
            "id": self.id,
            "teacher_id": self.teacher_id,
            "class_id": self.class_id,
            "subject_id": self.subject_id
        }