from datetime import datetime
from ..extensions import db

class AcademicAssignment(db.Model):
    __tablename__ = "academic_assignments"

    id = db.Column(db.Integer, primary_key=True)

    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"), nullable=False)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    file_path = db.Column(db.String(255))
    due_date = db.Column(db.Date, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    class_ = db.relationship("Class", backref="academic_assignments")
    subject = db.relationship("Subject", backref="academic_assignments")
    teacher = db.relationship("Teacher", backref="academic_assignments")
    submissions = db.relationship(
        "AssignmentSubmission",
        backref="assignment",
        cascade="all, delete-orphan"
    )


    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.strftime("%Y-%m-%d"),
            "class_id": self.class_id,
            "subject_id": self.subject_id,
            "class_name": self.class_.name if self.class_ else None,
            "section": self.class_.section if self.class_ else None,
            "subject_name": self.subject.name if self.subject else None,
            "file_path": self.file_path,
            "created_at": self.created_at.strftime("%Y-%m-%d")
            if self.created_at else None
        }