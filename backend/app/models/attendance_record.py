"""
AttendanceRecord stores one student's status for one AttendanceSession.
"""
from ..extensions import db


class AttendanceRecord(db.Model):
    __tablename__ = "attendance_records"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("attendance_sessions.id", ondelete="CASCADE"))
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"))
    status = db.Column(db.Enum("PRESENT", "ABSENT"), nullable=False)
    remarks = db.Column(db.String(255))

    session = db.relationship("AttendanceSession", backref=db.backref("records", lazy="dynamic"))
    student = db.relationship("Student", backref=db.backref("attendance_records", lazy="dynamic"))

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "student_id": self.student_id,
            "status": self.status,
            "remarks": self.remarks,
        }

    def __repr__(self):
        return f"<AttendanceRecord {self.id} session={self.session_id} student={self.student_id}>"
