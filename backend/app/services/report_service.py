# app/services/report_service.py
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, date
from sqlalchemy import func, and_, case
from ..extensions import db
from ..models.attendance_session import AttendanceSession
from ..models.attendance_record import AttendanceRecord
from ..models.student import Student
from ..utils.errors import APIError

# ---------- helpers ----------
def _normalize_dates(from_str: Optional[str], to_str: Optional[str]) -> Tuple[str, str]:
    """Return ISO date strings for from and to. Defaults to last 30 days if not provided."""
    if to_str:
        to_dt = datetime.fromisoformat(to_str)
    else:
        to_dt = datetime.utcnow()
    if from_str:
        from_dt = datetime.fromisoformat(from_str)
    else:
        from_dt = to_dt - timedelta(days=30)
    return from_dt.date().isoformat(), to_dt.date().isoformat()


# ---------- Defaulters (existing functionality) ----------
def get_defaulters(class_id: int, threshold_percent: float = 75.0,
                   date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Return list of students in class whose attendance percentage is < threshold_percent
    between date_from and date_to (inclusive).

    Returns each item: { student_id, roll, name, email, presents, total_sessions, percent }
    """
    date_from, date_to = _normalize_dates(date_from, date_to)

    # total sessions within range for class
    total_sessions_q = db.session.query(func.count(AttendanceSession.id).label("cnt"))\
        .filter(AttendanceSession.class_id == class_id)\
        .filter(AttendanceSession.session_date >= date_from)\
        .filter(AttendanceSession.session_date <= date_to)
    total_sessions = total_sessions_q.scalar() or 0

    if total_sessions == 0:
        return []

    # use case+sum to count PRESENT per student (safe across DBs)
    present_count_expr = func.sum(
        case(
            (AttendanceRecord.status == "PRESENT", 1),
            else_=0
        )
    ).label("present_count")


    records_q = (
        db.session.query(
            AttendanceRecord.student_id.label("student_id"),
            present_count_expr
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceSession.class_id == class_id)
        .filter(AttendanceSession.session_date >= date_from)
        .filter(AttendanceSession.session_date <= date_to)
        .group_by(AttendanceRecord.student_id)
    )

    present_map = {row.student_id: int(row.present_count or 0) for row in records_q.all()}

    students = Student.query.filter_by(class_id=class_id).order_by(Student.roll_no).all()

    out = []
    for s in students:
        presents = present_map.get(s.id, 0)
        percent = (presents / total_sessions) * 100.0 if total_sessions > 0 else 0.0
        if percent < float(threshold_percent):
            user = getattr(s, "user", None)
            out.append({
                "student_id": s.id,
                "roll": getattr(s, "roll_no", None),
                "name": getattr(user, "name", getattr(s, "name", None)),
                "email": getattr(user, "email", getattr(s, "email", None)),
                "presents": presents,
                "total_sessions": total_sessions,
                "percent": round(percent, 2)
            })

    out.sort(key=lambda x: x["percent"])
    return out


# compatibility alias expected by routes
def defaulters_list(class_id: int, threshold_percent: float = 75.0,
                    date_from: Optional[str] = None, date_to: Optional[str] = None) -> List[Dict[str, Any]]:
    """Alias kept for backward compatibility with older imports."""
    return get_defaulters(class_id=class_id, threshold_percent=threshold_percent,
                          date_from=date_from, date_to=date_to)


# ---------- Daily counts ----------
def class_daily_counts(class_id: int, date_from: str, date_to: str):
    present_sum = func.sum(
        case(
            (AttendanceRecord.status == "PRESENT", 1),
            else_=0
        )
    ).label("present_count")

    session_count = func.count(
        func.distinct(AttendanceSession.id)
    ).label("total_sessions")

    q = (
        db.session.query(
            AttendanceSession.session_date.label("date"),
            present_sum,
            session_count
        )
        .join(AttendanceRecord, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceSession.class_id == class_id)
        .filter(AttendanceSession.session_date >= date_from)
        .filter(AttendanceSession.session_date <= date_to)
        .group_by(AttendanceSession.session_date)
        .order_by(AttendanceSession.session_date)
    )

    return [
        {
            "date": row.date.isoformat(),
            "present": int(row.present_count or 0),
            "total_sessions": int(row.total_sessions or 0),
        }
        for row in q.all()
    ]



# ---------- Monthly summary ----------
def class_monthly_summary(class_id: int, year: int):
    date_from = date(year, 1, 1)
    date_to = date(year, 12, 31)

    present_sum = func.sum(
        case(
            (AttendanceRecord.status == "PRESENT", 1),
            else_=0
        )
    ).label("present_count")

    session_count = func.count(
        func.distinct(AttendanceSession.id)
    ).label("total_sessions")

    month_expr = func.extract("month", AttendanceSession.session_date).label("month")

    q = (
        db.session.query(
            month_expr,
            present_sum,
            session_count
        )
        .join(AttendanceRecord, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceSession.class_id == class_id)
        .filter(AttendanceSession.session_date >= date_from)
        .filter(AttendanceSession.session_date <= date_to)
        .group_by(month_expr)
        .order_by(month_expr)
    )

    return [
        {
            "month": int(row.month),
            "present": int(row.present_count or 0),
            "total_sessions": int(row.total_sessions or 0),
        }
        for row in q.all()
    ]
