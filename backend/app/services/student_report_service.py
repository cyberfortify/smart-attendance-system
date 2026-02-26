from sqlalchemy import func, case, extract
from app.extensions import db
from app.models.student import Student
from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.subject import Subject
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import Table
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from flask import send_file


def get_student_monthly_trend(student_id):
    rows = (
        db.session.query(
            extract("month", AttendanceSession.session_date).label("month"),
            func.count(AttendanceRecord.id).label("total"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label(
                "presents"
            ),
        )
        .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
        .filter(AttendanceRecord.student_id == student_id)
        .group_by("month")
        .order_by("month")
        .all()
    )

    result = []
    for r in rows:
        percent = round((r.presents * 100) / r.total) if r.total else 0
        result.append({"month": int(r.month), "percent": percent})

    return result


def get_student_subject_performance(student_id):
    rows = (
        db.session.query(
            Subject.name.label("subject"),
            func.count(AttendanceRecord.id).label("total"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label(
                "presents"
            ),
        )
        .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
        .join(Subject, Subject.id == AttendanceSession.subject_id)
        .filter(AttendanceRecord.student_id == student_id)
        .group_by(Subject.name)
        .all()
    )

    result = []
    for r in rows:
        percent = round((r.presents * 100) / r.total) if r.total else 0
        result.append({"subject": r.subject, "percent": percent})

    return result


def get_student_summary(student_id):
    row = (
        db.session.query(
            func.count(AttendanceRecord.id).label("total"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label(
                "presents"
            ),
        )
        .filter(AttendanceRecord.student_id == student_id)
        .first()
    )

    total = row.total or 0
    presents = row.presents or 0

    percent = round((presents * 100) / total) if total else 0

    if percent < 60:
        risk = "Critical"
    elif percent < 75:
        risk = "At Risk"
    else:
        risk = "Safe"

    return {
        "total_sessions": total,
        "presents": presents,
        "percent": percent,
        "risk": risk,
    }


def get_student_basic_info(student_id):
    student = Student.query.get(student_id)

    if not student:
        return None

    return {
        "name": student.user.name if student.user else None,
        "roll": student.roll_no,
        "class_id": student.class_id,
    }


def get_student_attendance_calendar(student_id):

    rows = (
        db.session.query(
            AttendanceSession.session_date,
            AttendanceRecord.status,
            AttendanceSession.subject_id,
            Subject.name.label("subject_name"),
        )
        .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
        .join(Subject, Subject.id == AttendanceSession.subject_id)
        .filter(AttendanceRecord.student_id == student_id)
        .all()
    )

    calendar = []

    for r in rows:
        calendar.append(
            {
                "date": r.session_date.isoformat(),
                "status": r.status,
                "subject_id": r.subject_id,
                "subject_name": r.subject_name,
            }
        )

    return calendar


def generate_student_pdf(student_id):
    summary = get_student_summary(student_id)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()
    elements.append(Paragraph("Student Attendance Report", styles["Heading1"]))
    elements.append(Spacer(1, 12))

    data = [
        ["Total Sessions", summary["total_sessions"]],
        ["Present", summary["presents"]],
        ["Attendance %", f"{summary['percent']}%"],
        ["Risk Level", summary["risk"]],
    ]

    table = Table(data)
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    return buffer
