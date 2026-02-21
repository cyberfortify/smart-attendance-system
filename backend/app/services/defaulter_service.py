from sqlalchemy import func, case
from typing import List, Dict
from app.extensions import db
from app.models.student import Student
from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.classes import Class as SchoolClass
from app.utils.errors import APIError


def get_class_defaulters(
    class_id: int,
    threshold: float = 75.0,
    date_from=None,
    date_to=None
) -> List[Dict]:

    klass = SchoolClass.query.get(class_id)
    if not klass:
        raise APIError("Class not found", 404)

    q = (
        db.session.query(
            Student.id.label("student_id"),
            Student.roll_no.label("roll"),
            func.count(AttendanceRecord.id).label("total_sessions"),
            func.sum(
                case(
                    (AttendanceRecord.status == "PRESENT", 1),
                    else_=0
                )
            ).label("presents"),
        )
        .join(AttendanceRecord, AttendanceRecord.student_id == Student.id)
        .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
        .filter(Student.class_id == class_id)
    )

    if date_from:
        q = q.filter(AttendanceSession.session_date >= date_from)
    if date_to:
        q = q.filter(AttendanceSession.session_date <= date_to)

    q = q.group_by(Student.id)

    rows = q.all()

    defaulters = []

    for r in rows:
        if r.total_sessions == 0:
            continue

        percent = round((r.presents * 100) / r.total_sessions)

        if percent < threshold:
            student = Student.query.get(r.student_id)
            defaulters.append({
                "student_id": r.student_id,
                "name": student.user.name if student.user else None,
                "roll": r.roll,
                "presents": r.presents,
                "total_sessions": r.total_sessions,
                "percent": percent,
            })

    # Worst attendance first
    defaulters.sort(key=lambda x: x["percent"])
    return defaulters
