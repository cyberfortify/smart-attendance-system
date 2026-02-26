from datetime import datetime
from ..extensions import db


class AttendanceSession(db.Model):
    __tablename__ = "attendance_sessions"

    __table_args__ = (
        db.UniqueConstraint(
            "class_id",
            "subject_id",      # ✅ ADD THIS
            "session_date",
            name="uq_attendance_class_subject_date"
        ),
    )

    id = db.Column(db.Integer, primary_key=True)

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

    teacher_id = db.Column(
        db.Integer,
        db.ForeignKey("teachers.id"),
        nullable=False
    )

    session_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    klass = db.relationship("Class", backref=db.backref("attendance_sessions", lazy="dynamic"))
    teacher = db.relationship("Teacher", backref=db.backref("attendance_sessions", lazy="dynamic"))
    subject = db.relationship("Subject", backref=db.backref("attendance_sessions", lazy="dynamic"))  # ✅ ADD

    def __repr__(self):
        return f"<AttendanceSession {self.id} class={self.class_id} subject={self.subject_id} date={self.session_date}>"