from typing import List, Dict, Any, Optional
from sqlalchemy import asc, func, case
from ..extensions import db
from ..models.teacher import Teacher
from ..models.teacher_classes import TeacherClass
from ..models.classes import Class as SchoolClass
from ..models.student import Student
from ..models.attendance_session import AttendanceSession
from ..models.attendance_record import AttendanceRecord
from ..utils.errors import APIError
from datetime import date, timedelta 

def is_teacher_assigned(teacher_id: int, class_id: int) -> bool:
    """Return True if teacher_id is assigned to class_id."""
    t = TeacherClass.query.filter_by(teacher_id=teacher_id, class_id=class_id).first()
    return t is not None

def get_class_report(class_id: int,
                     date_from: Optional[str] = None,
                     date_to: Optional[str] = None) -> Dict[str, Any]:
    """
    Return basic class report: per-student attendance summary for given period.
    """
    # Ensure class exists
    klass = SchoolClass.query.get(class_id)
    if not klass:
        raise APIError("Class not found", status_code=404)

    # All students in class
    students = Student.query.filter_by(class_id=class_id).all()
    student_ids = [s.id for s in students]
    if not student_ids:
        return {
            "class_id": class_id,
            "students": [],
            "average_attendance": 0.0,
        }

    # Per-student present/total
    subq = (
        db.session.query(
            AttendanceRecord.student_id.label("student_id"),
            func.count(AttendanceRecord.id).label("total"),
            func.sum(
                case(
                    (AttendanceRecord.status == "PRESENT", 1),
                    else_=0,
                )
            ).label("present"),
        )
        .join(
            AttendanceSession,
            AttendanceSession.id == AttendanceRecord.session_id,
        )
        .filter(AttendanceRecord.student_id.in_(student_ids))
    )

    if date_from:
        subq = subq.filter(AttendanceSession.session_date >= date_from)
    if date_to:
        subq = subq.filter(AttendanceSession.session_date <= date_to)

    subq = subq.group_by(AttendanceRecord.student_id).subquery()

    rows = (
        db.session.query(
            Student,
            subq.c.total,
            subq.c.present,
        )
        .outerjoin(subq, subq.c.student_id == Student.id)
        .filter(Student.id.in_(student_ids))
        .all()
    )

    students_out = []
    percentages = []
    for stud, total, present in rows:
        total = int(total or 0)
        present = int(present or 0)
        pct = round(present * 100.0 / total, 2) if total > 0 else 0.0
        percentages.append(pct)

        user = getattr(stud, "user", None)
        students_out.append({
            "student_id": stud.id,
            "name": getattr(user, "name", None),
            "roll_no": getattr(stud, "roll_no", None),
            "total_sessions": total,
            "present": present,
            "absent": max(0, total - present),
            "percentage": pct,
        })

    avg_attendance = round(sum(percentages) / len(percentages), 2) if percentages else 0.0

    return {
        "class_id": class_id,
        "students": students_out,
        "average_attendance": avg_attendance,
    }

def get_students_by_class(class_id: int) -> List[Dict[str, Any]]:
    """
    Return students for a class sorted by roll.
    Each student returned as dict with id, roll, name, email, class_id, etc.
    """
    # Ensure class exists
    sc = SchoolClass.query.filter_by(id=class_id).first()
    if not sc:
        raise APIError("Class not found", status_code=404)

    students = Student.query.filter_by(class_id=class_id).order_by(asc(Student.roll)).all()
    out = []
    for s in students:
        # if Student has 'user' relationship with name/email
        user = getattr(s, "user", None)
        out.append({
            "id": s.id,
            "roll": getattr(s, "roll", None),
            "name": getattr(user, "name", getattr(s, "name", None)),
            "email": getattr(user, "email", getattr(s, "email", None)),
            "class_id": getattr(s, "class_id", None),
        })
    return out

def create_session(class_id: int, teacher_id: int, session_date: str) -> AttendanceSession:
    """
    Create a session after verifying teacher is assigned to the class.
    Raises APIError(403) if not assigned.
    """
    if not is_teacher_assigned(teacher_id, class_id):
        raise APIError("Forbidden: teacher not assigned to this class", status_code=403)

    # correct logic
    existing = AttendanceSession.query.filter_by(
        class_id=class_id,
        session_date=session_date
    ).first()

    if existing:
        # If you prefer to allow multiple sessions per day, remove this check.
        raise APIError("Session for this class and date already exists", status_code=409)

    session = AttendanceSession(class_id=class_id, teacher_id=teacher_id, session_date=session_date)
    db.session.add(session)
    db.session.flush()  # get id without commit
    return session

def list_sessions_for_teacher(teacher_id: int, class_id: Optional[int] = None,
                              date_from: Optional[str] = None, date_to: Optional[str] = None,
                              limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """
    Return sessions created by teacher. Simple filters supported.
    """
    q = AttendanceSession.query.filter_by(teacher_id=teacher_id)
    if class_id:
        q = q.filter_by(class_id=class_id)
    if date_from:
        q = q.filter(AttendanceSession.session_date >= date_from)
    if date_to:
        q = q.filter(AttendanceSession.session_date <= date_to)

    q = q.order_by(AttendanceSession.session_date.desc(), AttendanceSession.id.desc()).limit(limit).offset(offset)
    rows = q.all()

    out = []
    for s in rows:
        out.append({
            "id": s.id,
            "class_id": s.class_id,
            "session_date": s.session_date.isoformat() if hasattr(s.session_date, "isoformat") else s.session_date,
            "created_at": s.created_at.isoformat() if hasattr(s, "created_at") else None,
        })
    return out

def get_session_with_records(session_id: int) -> Optional[Dict[str, Any]]:
    """
    Return session metadata and associated records with student info.
    """
    s = AttendanceSession.query.filter_by(id=session_id).first()
    if not s:
        return None

    records = (
        db.session.query(AttendanceRecord, Student)
        .join(Student, AttendanceRecord.student_id == Student.id)
        .filter(AttendanceRecord.session_id == session_id)
        .order_by(asc(Student.roll))
        .all()
    )

    recs_out = []
    for rec, stud in records:
        user = getattr(stud, "user", None)
        recs_out.append({
            "id": rec.id,
            "student_id": stud.id,
            "roll": getattr(stud, "roll", None),
            "name": getattr(user, "name", getattr(stud, "name", None)),
            "status": rec.status,
            "remarks": rec.remarks,
        })

    return {
        "id": s.id,
        "class_id": s.class_id,
        "teacher_id": s.teacher_id,
        "session_date": s.session_date.isoformat() if hasattr(s.session_date, "isoformat") else s.session_date,
        "records": recs_out
    }

def save_records(session_id: int, records: list):
    session = AttendanceSession.query.get(session_id)
    if not session:
        raise APIError("Attendance session not found", status_code=404)

    try:
        # SAFEST WAY: use session-level delete
        db.session.query(AttendanceRecord)\
            .filter(AttendanceRecord.session_id == session_id)\
            .delete(synchronize_session=False)

        db.session.add_all([
            AttendanceRecord(
                session_id=session_id,
                student_id=r["student_id"],
                status=r["status"],
                remarks=r.get("remarks")
            )
            for r in records
        ])

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        raise
     

def get_student_attendance(student_id: int, 
                          date_from: Optional[str] = None,
                          date_to: Optional[str] = None) -> Dict[str, Any]:
    student = Student.query.get(student_id)
    if not student:
        return {"total_sessions": 0, "present": 0, "absent": 0, "percentage": 0.0}
    
    q = (
        db.session.query(
            func.count(AttendanceRecord.id).label("total"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label("present"),
            func.sum(case((AttendanceRecord.status == "ABSENT", 1), else_=0)).label("absent"),
        )
        .outerjoin(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
        .filter(AttendanceRecord.student_id == student_id)
    )

    if date_from:
        q = q.filter(AttendanceSession.session_date >= date_from)
    if date_to:
        q = q.filter(AttendanceSession.session_date <= date_to)

    row = q.first()
    total = int(row.total or 0)
    present = int(row.present or 0)
    absent = int(row.absent or 0)
    percentage = round(present * 100.0 / total, 1) if total > 0 else 0.0

    return {
        "total_sessions": total,
        "present": present,
        "absent": absent,
        "percentage": percentage,
        "student_id": student_id,
        "class_id": student.class_id
    }

def get_student_daily_attendance(student_id: int, days: int = 7):
    today = date.today()
    date_from = today - timedelta(days=days - 1)

    rows = (
        db.session.query(
            AttendanceSession.session_date.label("day"),
            func.count(AttendanceRecord.id).label("total"),
            func.sum(
                case((AttendanceRecord.status == "PRESENT", 1), else_=0)
            ).label("present"),
        )
        .outerjoin(
            AttendanceRecord,
            (AttendanceRecord.session_id == AttendanceSession.id)
            & (AttendanceRecord.student_id == student_id),
        )
        .filter(
            AttendanceSession.session_date >= date_from,
            AttendanceSession.session_date <= today,
        )
        .group_by(AttendanceSession.session_date)
        .order_by(AttendanceSession.session_date)
        .all()
    )

    series = []
    for row in rows:
        total = int(row.total or 0)
        present = int(row.present or 0)
        absent = total - present
        pct = round(present / (total or 1) * 100, 1)
        series.append(
            {
                "label": row.day.strftime("%d %b"),
                "present": present,
                "absent": absent,
                "percentage": pct,
            }
        )
    return series

def get_student_weekly_attendance(student_id: int, weeks: int = 8):
    today = date.today()
    date_from = today - timedelta(weeks=weeks)

    rows = (
        db.session.query(
            func.date_trunc("week", AttendanceSession.session_date).label("week_start"),
            func.count(AttendanceRecord.id).label("total"),
            func.sum(
                case((AttendanceRecord.status == "PRESENT", 1), else_=0)
            ).label("present"),
        )
        .outerjoin(
            AttendanceRecord,
            (AttendanceRecord.session_id == AttendanceSession.id)
            & (AttendanceRecord.student_id == student_id),
        )
        .filter(
            AttendanceSession.session_date >= date_from,
            AttendanceSession.session_date <= today,
        )
        .group_by(func.date_trunc("week", AttendanceSession.session_date))
        .order_by(func.date_trunc("week", AttendanceSession.session_date))
        .all()
    )

    series = []
    for row in rows:
        total = int(row.total or 0)
        present = int(row.present or 0)
        absent = total - present
        pct = round(present / (total or 1) * 100, 1)
        series.append(
            {
                "label": row.week_start.strftime("Wk %W"),
                "present": present,
                "absent": absent,
                "percentage": pct,
            }
        )
    return series

def get_student_monthly_attendance(student_id: int, year: int = None):
    """Monthly attendance breakdown"""
    if year is None:
        year = date.today().year
        
    student = Student.query.get(student_id)
    if not student:
        return []
    
    date_from = f"{year}-01-01"
    date_to = f"{year}-12-31"
    
    monthly_data = db.session.query(
        func.extract('month', AttendanceSession.session_date).label('month'),
        func.count(AttendanceRecord.id).label('total'),
        func.sum(case((AttendanceRecord.status == 'PRESENT', 1), else_=0)).label('present')
    ).outerjoin(
        AttendanceRecord, 
        (AttendanceRecord.session_id == AttendanceSession.id) & 
        (AttendanceRecord.student_id == student_id)
    ).filter(
        AttendanceSession.class_id == student.class_id,
        AttendanceSession.session_date >= date_from,
        AttendanceSession.session_date <= date_to
    ).group_by(func.extract('month', AttendanceSession.session_date))\
     .order_by('month').all()
    
    return [{
        "month": int(row.month),
        "present": int(row.present or 0),
        "total": int(row.total or 0),
        "percentage": round((row.present or 0) / (row.total or 1) * 100, 1)
    } for row in monthly_data]
