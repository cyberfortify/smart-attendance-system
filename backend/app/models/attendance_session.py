"""
AttendanceSession represents an attendance event (class + date + teacher).
"""
from datetime import datetime
from ..extensions import db


class AttendanceSession(db.Model):
    __tablename__ = "attendance_sessions"

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"))
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"))
    session_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    klass = db.relationship("Class", backref=db.backref("attendance_sessions", lazy="dynamic"))
    teacher = db.relationship("Teacher", backref=db.backref("attendance_sessions", lazy="dynamic"))

    def __repr__(self):
        return f"<AttendanceSession {self.id} class={self.class_id} date={self.session_date}>"
