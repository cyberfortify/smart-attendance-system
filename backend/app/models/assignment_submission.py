from datetime import datetime
from ..extensions import db

class AssignmentSubmission(db.Model):
    __tablename__ = "assignment_submissions"

    id = db.Column(db.Integer, primary_key=True)

    assignment_id = db.Column(
        db.Integer,
        db.ForeignKey("academic_assignments.id", ondelete="CASCADE"),
        nullable=False
    )
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"))

    file_path = db.Column(db.String(255))
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)