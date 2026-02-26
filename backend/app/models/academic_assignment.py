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
    due_date = db.Column(db.Date, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "class_id": self.class_id,
            "subject_id": self.subject_id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat(),
            "created_at": self.created_at.isoformat()
        }