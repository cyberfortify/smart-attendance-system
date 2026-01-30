from datetime import date, datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func,case
from ...extensions import db
from ...models.teacher_classes import TeacherClass
from ...models.classes import Class as SchoolClass
from ...models.teacher import Teacher
from ...models.student import Student
from ...models.attendance_session import AttendanceSession
from ...models.attendance_record import AttendanceRecord
from ...services.attendance_service import (
    get_students_by_class,
    is_teacher_assigned,
    create_session,
    save_records,
    get_session_with_records,
    list_sessions_for_teacher,
)
from ...utils.decorators import role_required
from ...utils.validators import validate_json
from ...utils.errors import APIError
from app.models import teacher

teacher_bp = Blueprint("teacher", __name__, url_prefix="/api/teacher")


def _get_current_teacher():
    """Helper: return Teacher object for logged‑in user_id or raise."""
    user_id = get_jwt_identity()
    try:
        teacher_user_id = int(user_id)
    except (TypeError, ValueError):
        raise APIError("Invalid teacher user id in token", status_code=400)

    teacher = Teacher.query.filter_by(user_id=teacher_user_id).first()
    if not teacher:
        raise APIError("Teacher profile not found", status_code=404)
    return teacher

@teacher_bp.route("/dashboard", methods=["GET"])
@role_required("TEACHER")
def teacher_dashboard():
    teacher = _get_current_teacher()
    today = date.today()

    # Assigned classes
    teacher_class_ids = (
        db.session.query(TeacherClass.class_id)
        .filter(TeacherClass.teacher_id == teacher.id)
        .scalar_subquery()
    )

    # Total students
    total_students = (
        db.session.query(func.count(func.distinct(Student.id)))
        .filter(Student.class_id.in_(teacher_class_ids))
        .scalar()
        or 0
    )

    #  TODAY ATTENDANCE (ALL CLASSES)
    today_sessions = (
        db.session.query(AttendanceSession.id)
        .filter(
            AttendanceSession.teacher_id == teacher.id,
            AttendanceSession.session_date == today
        )
        .scalar_subquery()
    )

    total_records = (
        db.session.query(func.count(AttendanceRecord.id))
        .filter(AttendanceRecord.session_id.in_(today_sessions))
        .scalar()
        or 0
    )

    present_records = (
        db.session.query(func.count(AttendanceRecord.id))
        .filter(
            AttendanceRecord.session_id.in_(today_sessions),
            AttendanceRecord.status == "PRESENT",
        )
        .scalar()
        or 0
    )

    today_attendance_rate = (
        round((present_records * 100) / total_records)
        if total_records > 0 else 0
    )

    return jsonify({
        "success": True,
        "data": {
            "total_students": total_students,
            "today_attendance_rate": today_attendance_rate,
            "pending_tasks": 0,
            "upcoming_classes": 0,
        }
    }), 200


@teacher_bp.route("/classes", methods=["GET"])
@role_required("TEACHER")
def teacher_list_classes():
    """
    List classes assigned to the logged-in teacher.
    """
    teacher = _get_current_teacher()

    rows = (
        db.session.query(SchoolClass.id, SchoolClass.name, SchoolClass.section)
        .join(TeacherClass, TeacherClass.class_id == SchoolClass.id)
        .filter(TeacherClass.teacher_id == teacher.id)
        .all()
    )
    classes = [
        {"id": cid, "name": name, "section": section}
        for (cid, name, section) in rows
    ]
    return jsonify({"success": True, "data": classes}), 200


@teacher_bp.route("/classes/<int:class_id>/students", methods=["GET"])
@role_required("TEACHER")
def teacher_get_students_by_class(class_id):
    teacher = _get_current_teacher()

    # Verify teacher is assigned to this class
    assigned = TeacherClass.query.filter_by(
        teacher_id=teacher.id, class_id=class_id
    ).first()
    if not assigned:
        raise APIError("Forbidden: teacher not assigned to this class", status_code=403)

    # Direct query instead of service (debug clear rahega)
    students = (
        Student.query
        .filter(Student.class_id == class_id)
        .order_by(Student.roll_no.asc())
        .all()
    )

    data = [
        {
            "id": s.id,
            "name": s.user.name if s.user else None,
            "roll_number": s.roll_no,
            "class_id": s.class_id,
        }
        for s in students
    ]

    return jsonify({"success": True, "data": data}), 200


@teacher_bp.route("/sessions", methods=["POST"])
@role_required("TEACHER")
@validate_json({"class_id": int, "session_date": "date"})
def create_attendance_session():
    """
    Create a new attendance session for a class (teacher must be assigned).
    Body:
      {
        "class_id": int,
        "session_date": "YYYY-MM-DD"
      }
    """
    data = request.get_json() or {}
    class_id = int(data.get("class_id"))
    session_date_raw = data.get("session_date")

    # session_date_raw may already be date if validator converted it; but handle string too.
    if isinstance(session_date_raw, str):
        try:
            session_date = datetime.strptime(session_date_raw, "%Y-%m-%d").date()
        except ValueError:
            raise APIError("Invalid session_date format, expected YYYY-MM-DD", 400)
    else:
        session_date = session_date_raw

    teacher = _get_current_teacher()

    # Service should check teacher–class assignment internally as well
    session = create_session(
        class_id=class_id, teacher_id=teacher.id, session_date=session_date
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({"success": True, "data": {"session_id": session.id}}), 201


@teacher_bp.route("/sessions", methods=["GET"])
@role_required("TEACHER")
def teacher_list_sessions():
    """
    List sessions created by logged-in teacher.
    Query params:
      class_id: optional int
      from: optional YYYY-MM-DD
      to: optional YYYY-MM-DD
      limit, offset: pagination
    """
    teacher = _get_current_teacher()

    class_id = request.args.get("class_id", type=int)
    year = request.args.get("year", type=int)
    if not class_id or not year:
        raise APIError("class_id and year are required", status_code=400)

    date_from = request.args.get("from")
    date_to = request.args.get("to")
    limit = request.args.get("limit", default=100, type=int)
    offset = request.args.get("offset", default=0, type=int)

    sessions = list_sessions_for_teacher(
        teacher_id=teacher.id,
        class_id=class_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return jsonify({"success": True, "data": sessions}), 200


# @teacher_bp.route("/sessions/<int:session_id>/records", methods=["PUT"])
# @role_required("TEACHER")
# def update_session_records(session_id):
#     """
#     Replace/update attendance records for a session.
#     Body: [
#       { "student_id": int, "status": "PRESENT"|"ABSENT", "remarks": "..." },
#       ...
#     ]
#     """
#     data = request.get_json(silent=True)
#     if data is None:
#         raise APIError("Request body must be JSON", status_code=400)
#     if not isinstance(data, list):
#         raise APIError("Expected a list of records", status_code=400)

#     teacher = _get_current_teacher()

#     session = AttendanceSession.query.filter_by(id=session_id).first()
#     if not session:
#         raise APIError("Session not found", status_code=404)
#     if session.teacher_id != teacher.id:
#         raise APIError("Forbidden: you do not own this session", status_code=403)

#     # Validate records
#     for idx, rec in enumerate(data):
#         if not isinstance(rec, dict):
#             raise APIError(f"Record at index {idx} must be an object", status_code=400)
#         if "student_id" not in rec or "status" not in rec:
#             raise APIError(
#                 f"Record at index {idx} missing 'student_id' or 'status'", status_code=400
#             )
#         try:
#             rec_student_id = int(rec["student_id"])
#             rec["student_id"] = rec_student_id
#         except Exception:
#             raise APIError(
#                 f"Record at index {idx} has invalid 'student_id'", status_code=400
#             )
#         if rec["status"] not in ("PRESENT", "ABSENT"):
#             raise APIError(
#                 f"Record at index {idx} has invalid 'status' (must be 'PRESENT' or 'ABSENT')",
#                 status_code=400,
#             )
#         if (
#             "remarks" in rec
#             and rec["remarks"] is not None
#             and not isinstance(rec["remarks"], str)
#         ):
#             raise APIError(
#                 f"Record at index {idx} 'remarks' must be a string", status_code=400
#             )

#     # Save attendance records (FINAL FIX)
#     try:
#         save_records(session_id=session_id, records=data)

#     except APIError as e:
#         #  Business / validation error → same status return
#         raise e

#     except Exception:
#         #  Real server error
#         raise APIError("Failed to save attendance", status_code=500)

#     #  ONLY SUCCESS PATH
#     return jsonify({
#         "success": True,
#         "message": "Attendance saved successfully"
#     }), 200



@teacher_bp.route("/sessions/<int:session_id>/records", methods=["PUT"])
@role_required("TEACHER")
def update_session_records(session_id):
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, list):
        raise APIError("Invalid request body", status_code=400)

    teacher = _get_current_teacher()

    session = AttendanceSession.query.filter_by(id=session_id).first()
    if not session:
        raise APIError("Session not found", status_code=404)
    if session.teacher_id != teacher.id:
        raise APIError("Forbidden", status_code=403)

    # ONLY THIS TRY BLOCK
    try:
        save_records(session_id=session_id, records=data)

    except APIError as e:
        # preserve real error
        raise e

    except Exception:
        raise APIError("Failed to save attendance", status_code=500)

    #  SUCCESS PATH — NO EXCEPTION AFTER THIS
    return jsonify({
        "success": True,
        "message": "Attendance saved successfully"
    }), 200


@teacher_bp.route("/attendance/summary", methods=["GET"])
@role_required("TEACHER")
def teacher_attendance_summary():
    teacher = _get_current_teacher()

    teacher_class_ids = (
        db.session.query(TeacherClass.class_id)
        .filter(TeacherClass.teacher_id == teacher.id)
        .scalar_subquery()
    )

    sessions_subq = (
        db.session.query(AttendanceSession.id)
        .filter(AttendanceSession.class_id.in_(teacher_class_ids))
        .scalar_subquery()
    )

    present_count = (
        db.session.query(func.count(AttendanceRecord.id))
        .filter(
            AttendanceRecord.session_id.in_(sessions_subq),
            AttendanceRecord.status == "PRESENT",
        )
        .scalar()
        or 0
    )

    absent_count = (
        db.session.query(func.count(AttendanceRecord.id))
        .filter(
            AttendanceRecord.session_id.in_(sessions_subq),
            AttendanceRecord.status == "ABSENT",
        )
        .scalar()
        or 0
    )

    records_q = (
        db.session.query(
            Student.id.label("student_id"),
            Student.user_id.label("user_id"),
            SchoolClass.name.label("class_name"),
            SchoolClass.section.label("section"),
            func.count(AttendanceRecord.id).label("total"),
            func.sum(
                case(
                    (AttendanceRecord.status == "PRESENT", 1),
                    else_=0
                )
            ).label("present")
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .join(Student, AttendanceRecord.student_id == Student.id)
        .join(SchoolClass, Student.class_id == SchoolClass.id)
        .filter(AttendanceSession.class_id.in_(teacher_class_ids))
        .group_by(Student.id, Student.user_id, SchoolClass.name, SchoolClass.section)
    )

    defaulters = []
    for row in records_q:
        if row.total == 0:
            continue
        rate = round(row.present * 100 / row.total)
        defaulters.append({
            "student_id": row.student_id,
            "class_name": f"{row.class_name}{' - ' + row.section if row.section else ''}",
            "attendance_rate": rate,
        })

    defaulters.sort(key=lambda d: d["attendance_rate"])

    return jsonify({
        "success": True,
        "data": {
            "present_count": present_count,
            "absent_count": absent_count,
            "defaulters": defaulters[:10],
        }
    }), 200


# @teacher_bp.route("/attendance/summary/today", methods=["GET"])
# @role_required("TEACHER")
# def teacher_attendance_summary_today():
#     teacher = _get_current_teacher()
#     today = datetime.utcnow().date() 

#     teacher_class_ids = (
#         db.session.query(TeacherClass.class_id)
#         .filter(TeacherClass.teacher_id == teacher.id)
#         .scalar_subquery()
#     )

#     today_sessions = (
#         db.session.query(AttendanceSession.id)
#         .filter(
#             AttendanceSession.teacher_id == teacher.id,
#             AttendanceSession.class_id.in_(teacher_class_ids),
#             AttendanceSession.session_date == today
#         )
#         .scalar_subquery()
#     )

#     present = (
#         db.session.query(func.count(AttendanceRecord.id))
#         .filter(
#             AttendanceRecord.session_id.in_(today_sessions),
#             AttendanceRecord.status == "PRESENT"
#         )
#         .scalar()
#         or 0
#     )

#     absent = (
#         db.session.query(func.count(AttendanceRecord.id))
#         .filter(
#             AttendanceRecord.session_id.in_(today_sessions),
#             AttendanceRecord.status == "ABSENT"
#         )
#         .scalar()
#         or 0
#     )

#     return jsonify({
#         "success": True,
#         "data": {
#             "present_count": present,
#             "absent_count": absent
#         }
#     }), 200


@teacher_bp.route("/sessions/existing", methods=["GET"])
@role_required("TEACHER")
def get_existing_session():
    teacher = _get_current_teacher()

    class_id = request.args.get("class_id", type=int)
    session_date = request.args.get("session_date")

    if not class_id or not session_date:
        raise APIError("class_id and session_date required", 400)

    try:
        session_date = datetime.strptime(session_date, "%Y-%m-%d").date()
    except ValueError:
        raise APIError("Invalid date format", 400)

    session = AttendanceSession.query.filter_by(
        teacher_id=teacher.id,
        class_id=class_id,
        session_date=session_date
    ).first()

    if not session:
        return jsonify({"success": True, "data": None}), 200

    return jsonify({
        "success": True,
        "data": {
            "session_id": session.id
        }
    }), 200


