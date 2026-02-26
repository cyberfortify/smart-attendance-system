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

# ---------- Daily counts ----------
def class_daily_counts(class_id: int, date_from: str, date_to: str, subject_id: Optional[int] = None):

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
    )   
    if subject_id:
        q = q.filter(AttendanceSession.subject_id == subject_id)

    q = q.group_by(AttendanceSession.session_date)\
         .order_by(AttendanceSession.session_date)

    return [
        {
            "date": row.date.isoformat(),
            "present": int(row.present_count or 0),
            "total_sessions": int(row.total_sessions or 0),
        }
        for row in q.all()
    ]

# ---------- Monthly summary ----------
def class_monthly_summary(class_id: int, year: int, subject_id: Optional[int] = None):

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
    )

    if subject_id:
        q = q.filter(AttendanceSession.subject_id == subject_id)

    q = q.group_by(month_expr)\
         .order_by(month_expr)

    return [
        {
            "month": int(row.month),
            "present": int(row.present_count or 0),
            "total_sessions": int(row.total_sessions or 0),
        }
        for row in q.all()
    ]