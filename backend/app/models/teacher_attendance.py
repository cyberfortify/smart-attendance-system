from datetime import datetime
from ..extensions import db

class TeacherAttendance(db.Model):
    __tablename__ = "teacher_attendance"

    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"), nullable=False)
    attendance_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum("PRESENT", "ABSENT"), nullable=False)
    method = db.Column(db.String(50))  # FACE / MANUAL
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship("Teacher", backref="self_attendance")