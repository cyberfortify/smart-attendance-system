from deepface import DeepFace
import tempfile
import os
import cv2
import json
import uuid
import numpy as np
from datetime import date, datetime
from scipy.spatial.distance import cosine
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func, case, select
from ...extensions import db
from ...models.teacher_classes import TeacherClass
from ...models.classes import Class as SchoolClass
from ...models.teacher import Teacher
from ...models.student import Student
from ...models.attendance_session import AttendanceSession
from ...models.attendance_record import AttendanceRecord
from ...models.teacher_attendance import TeacherAttendance
from ...models.academic_assignment import AcademicAssignment
from ...models.assignment_submission import AssignmentSubmission
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
from ...utils.notification_helper import create_notification
from ...utils.errors import APIError
from app.models import teacher
from ...models.teacher_subject_assignments import TeacherSubjectAssignment
from ...models.subject import Subject
from ...models.notification import Notification
from ...models.teacher_subject_assignments import TeacherSubjectAssignment

teacher_bp = Blueprint("teacher", __name__, url_prefix="/api/teacher")


@teacher_bp.route("/notifications", methods=["GET"])
@role_required("TEACHER")
def teacher_notifications():

    user_id = get_jwt_identity()

    notifications = (
        Notification.query.filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return (
        jsonify(
            {
                "success": True,
                "data": [
                    {
                        "id": n.id,
                        "message": n.message,
                        "is_read": n.is_read,
                        "created_at": n.created_at,
                    }
                    for n in notifications
                ],
            }
        ),
        200,
    )


@teacher_bp.route("/notifications/read", methods=["PATCH"])
@role_required("TEACHER")
def mark_teacher_notifications_read():

    user_id = get_jwt_identity()

    Notification.query.filter_by(user_id=user_id, is_read=False).update(
        {"is_read": True}
    )

    db.session.commit()

    return jsonify({"success": True}), 200


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

# Ye API teacher ko apne aap ki attendance mark karne degi using face recognition. Admin ne pehle se face register karwaya hoga, tabhi ye chalega. Teacher apni image bhejega, system usko verify karega aur attendance mark karega.
@teacher_bp.route("/self-attendance", methods=["POST"])
@role_required("TEACHER")
def teacher_self_attendance():

    teacher = Teacher.query.filter_by(user_id=get_jwt_identity()).first()

    if not teacher:
        return jsonify({"error": "Teacher profile not found"}), 404

    if not teacher.face_embedding:
        return jsonify({"error": "Face not registered by admin"}), 400

    if "image" not in request.files:
        return jsonify({"error": "Image required"}), 400

    today = datetime.utcnow().date()

    existing = TeacherAttendance.query.filter_by(
        teacher_id=teacher.id,
        attendance_date=today
    ).first()

    if existing:
        return jsonify({"message": "Attendance already marked"}), 200

    try:
        file = request.files["image"]
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        embedding = DeepFace.represent(
            img_path=image,
            model_name="ArcFace",
            enforce_detection=False
        )[0]["embedding"]

        stored_embedding = np.array(json.loads(teacher.face_embedding))
        captured_embedding = np.array(embedding)

        from scipy.spatial.distance import cosine
        distance = cosine(stored_embedding, captured_embedding)

        if distance > 0.6:
            return jsonify({"success": False, "message": "Face not matched"}), 400

        record = TeacherAttendance(
            teacher_id=teacher.id,
            attendance_date=today,
            status="PRESENT",
            method="FACE"
        )

        db.session.add(record)
        db.session.commit()

        return jsonify({"success": True, "message": "Attendance marked"})

    except Exception as e:
        db.session.rollback()
        print("Self attendance error:", e)
        return jsonify({"error": "Attendance failed"}), 500


@teacher_bp.route("/self-attendance-history", methods=["GET"])
@role_required("TEACHER")
def self_attendance_history():
    teacher = _get_current_teacher()

    records = TeacherAttendance.query.filter_by(
        teacher_id=teacher.id
    ).order_by(TeacherAttendance.attendance_date.desc()).all()

    return jsonify({
        "success": True,
        "data": [
            {
                "attendance_date": r.attendance_date,
                "status": r.status
            }
            for r in records
        ]
    })

@teacher_bp.route("/self-attendance-summary", methods=["GET"])
@role_required("TEACHER")
def teacher_attendance_summary():
    teacher = _get_current_teacher()

    records = TeacherAttendance.query.filter_by(
        teacher_id=teacher.id
    ).all()

    total = len(records)
    present = sum(1 for r in records if r.status == "PRESENT")
    absent = total - present

    percentage = round((present / total) * 100, 2) if total > 0 else 0

    return jsonify({
        "success": True,
        "data": {
            "total": total,
            "present": present,
            "absent": absent,
            "percentage": percentage
        }
    })

@teacher_bp.route("/self-attendance-monthly", methods=["GET"])
@role_required("TEACHER")
def teacher_monthly_attendance():

    teacher = _get_current_teacher()

    current_year = datetime.utcnow().year

    rows = db.session.query(
        func.extract("month", TeacherAttendance.attendance_date).label("month"),
        func.sum(case((TeacherAttendance.status == "PRESENT", 1), else_=0)).label("present"),
        func.count(TeacherAttendance.id).label("total")
    ).filter(
        TeacherAttendance.teacher_id == teacher.id,
        func.extract("year", TeacherAttendance.attendance_date) == current_year
    ).group_by("month").all()

    data = []

    for r in rows:
        data.append({
            "month": int(r.month),
            "present": int(r.present),
            "absent": int(r.total - r.present)
        })

    return jsonify({"success": True, "data": data})


@teacher_bp.route("/self-attendance-by-month", methods=["GET"])
@role_required("TEACHER")
def teacher_self_attendance_by_month():
    try:
        teacher = _get_current_teacher()

        if not teacher:
            return jsonify({"success": False, "error": "Teacher not found"}), 404

        month = request.args.get("month")
        if not month:
            return jsonify({"success": True, "data": []})

        year, month_num = month.split("-")

        start_date = date(int(year), int(month_num), 1)

        if int(month_num) == 12:
            end_date = date(int(year) + 1, 1, 1)
        else:
            end_date = date(int(year), int(month_num) + 1, 1)

        records = TeacherAttendance.query.filter(
            TeacherAttendance.teacher_id == teacher.id,
            TeacherAttendance.attendance_date >= start_date,
            TeacherAttendance.attendance_date < end_date
        ).all()

        result = [
            {
                "day": r.attendance_date.day,
                "status": r.status
            }
            for r in records
        ]

        return jsonify({"success": True, "data": result})

    except Exception as e:
        print("ERROR IN MONTH ROUTE:", e)
        return jsonify({"success": False, "error": str(e)}), 500


@teacher_bp.route("/performance", methods=["GET"])
@role_required("TEACHER")
def teacher_performance():

    teacher = _get_current_teacher()

    # Sessions taken
    total_sessions = AttendanceSession.query.filter_by(
        teacher_id=teacher.id
    ).count()

    # Student attendance records handled
    total_records = (
        db.session.query(func.count(AttendanceRecord.id))
        .join(AttendanceSession)
        .filter(AttendanceSession.teacher_id == teacher.id)
        .scalar()
        or 0
    )

    present_records = (
        db.session.query(func.count(AttendanceRecord.id))
        .join(AttendanceSession)
        .filter(
            AttendanceSession.teacher_id == teacher.id,
            AttendanceRecord.status == "PRESENT"
        )
        .scalar()
        or 0
    )

    attendance_rate = (
        round((present_records * 100) / total_records)
        if total_records > 0 else 0
    )

    return jsonify({
        "success": True,
        "data": {
            "total_sessions_taken": total_sessions,
            "total_student_records": total_records,
            "average_attendance_rate": attendance_rate
        }
    })

@teacher_bp.route("/dashboard", methods=["GET"])
@role_required("TEACHER")
def teacher_dashboard():
    teacher = _get_current_teacher()
    today = date.today()

    # 🔹 Get assigned class IDs from TeacherSubjectAssignment
    teacher_class_ids = (
        db.session.query(TeacherSubjectAssignment.class_id)
        .filter(TeacherSubjectAssignment.teacher_id == teacher.id)
        .distinct()
        .subquery()
    )

    # 🔹 Total students
    total_students = (
        db.session.query(func.count(Student.id))
        .filter(
            Student.class_id.in_(
                db.session.query(TeacherSubjectAssignment.class_id).filter(
                    TeacherSubjectAssignment.teacher_id == teacher.id
                )
            )
        )
        .scalar()
        or 0
    )

    # 🔹 Today's sessions
    total_records = (
        db.session.query(func.count(AttendanceRecord.id))
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceSession.teacher_id == teacher.id,
            AttendanceSession.session_date == today,
        )
        .scalar()
        or 0
    )

    present_records = (
        db.session.query(func.count(AttendanceRecord.id))
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceSession.teacher_id == teacher.id,
            AttendanceSession.session_date == today,
            AttendanceRecord.status == "PRESENT",
        )
        .scalar()
        or 0
    )

    today_attendance_rate = (
        round((present_records * 100) / total_records) if total_records > 0 else 0
    )

    return (
        jsonify(
            {
                "success": True,
                "data": {
                    "total_students": total_students,
                    "today_attendance_rate": today_attendance_rate,
                    "pending_tasks": 0,
                    "upcoming_classes": 0,
                },
            }
        ),
        200,
    )


@teacher_bp.route("/classes", methods=["GET"])
@role_required("TEACHER")
def teacher_list_classes():

    teacher = _get_current_teacher()

    rows = (
        db.session.query(SchoolClass.id, SchoolClass.name, SchoolClass.section)
        .join(
            TeacherSubjectAssignment,
            TeacherSubjectAssignment.class_id == SchoolClass.id,
        )
        .filter(TeacherSubjectAssignment.teacher_id == teacher.id)
        .distinct()
        .all()
    )

    classes = [
        {"id": cid, "name": name, "section": section} for (cid, name, section) in rows
    ]

    return jsonify({"success": True, "data": classes}), 200


@teacher_bp.route("/classes/<int:class_id>/students", methods=["GET"])
@role_required("TEACHER")
def teacher_get_students_by_class(class_id):
    teacher = _get_current_teacher()

    # Verify teacher is assigned to this class
    assigned = TeacherSubjectAssignment.query.filter_by(
        teacher_id=teacher.id, class_id=class_id
    ).first()
    if not assigned:
        raise APIError("Forbidden: teacher not assigned to this class", status_code=403)

    # Direct query instead of service (debug clear rahega)
    students = (
        Student.query.filter(Student.class_id == class_id)
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


@teacher_bp.route("/classes/<int:class_id>/subjects/<int:subject_id>/students")
@role_required("TEACHER")
def teacher_get_students_by_subject(class_id, subject_id):
    teacher = _get_current_teacher()

    assigned = TeacherSubjectAssignment.query.filter_by(
        teacher_id=teacher.id, class_id=class_id, subject_id=subject_id
    ).first()

    if not assigned:
        raise APIError("Forbidden", 403)

    students = Student.query.filter_by(class_id=class_id).all()

    return jsonify({"success": True, "data": [s.to_dict() for s in students]}), 200


@teacher_bp.route("/sessions", methods=["POST"])
@role_required("TEACHER")
@validate_json({"class_id": int, "subject_id": int, "session_date": "date"})
def create_attendance_session():

    data = request.get_json()
    class_id = data["class_id"]
    subject_id = data["subject_id"]
    session_date = data["session_date"]

    teacher = _get_current_teacher()

    # Check teacher assigned to this subject
    assigned = TeacherSubjectAssignment.query.filter_by(
        teacher_id=teacher.id, class_id=class_id, subject_id=subject_id
    ).first()

    if not assigned:
        raise APIError("Forbidden: Not assigned to this subject", 403)

    # Check duplicate session
    existing = AttendanceSession.query.filter_by(
        class_id=class_id, subject_id=subject_id, session_date=session_date
    ).first()

    if existing:
        raise APIError("Session already exists for this subject on this date", 400)

    session = AttendanceSession(
        class_id=class_id,
        subject_id=subject_id,
        teacher_id=teacher.id,
        session_date=session_date,
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

    assigned = TeacherSubjectAssignment.query.filter_by(
        teacher_id=teacher.id, class_id=session.class_id, subject_id=session.subject_id
    ).first()

    if not assigned:
        raise APIError("Not authorized for this subject", 403)

    try:
        save_records(session_id=session_id, records=data)

        #  Send notification to students
        records = AttendanceRecord.query.filter_by(session_id=session_id).all()

        for record in records:
            student = Student.query.get(record.student_id)
            if not student:
                continue

            create_notification(
                user_id=student.user_id,
                title="Attendance Updated",
                message=f"Your attendance has been marked as {record.status} for {session.session_date}.",
                type="info" if record.status == "PRESENT" else "warning",
            )

    except APIError as e:
        # preserve real error
        raise e

    except Exception:
        raise APIError("Failed to save attendance", status_code=500)

    #  SUCCESS PATH — NO EXCEPTION AFTER THIS
    return jsonify({"success": True, "message": "Attendance saved successfully"}), 200


@teacher_bp.route("/attendance/summary", methods=["GET"])
@role_required("TEACHER")
def attendance_summary():

    # 🔹 Get current teacher
    user_id = get_jwt_identity()
    teacher = Teacher.query.filter_by(user_id=user_id).first()

    if not teacher:
        return jsonify({"success": False, "error": "Teacher not found"}), 404

    # 🔹 Query attendance records
    records = (
        db.session.query(
            func.count(AttendanceRecord.id).label("total"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label(
                "present_count"
            ),
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceSession.teacher_id == teacher.id)
        .first()
    )

    total = records.total or 0
    present = records.present_count or 0

    return (
        jsonify(
            {
                "success": True,
                "data": {"present_count": present, "absent_count": total - present},
            }
        ),
        200,
    )


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
        teacher_id=teacher.id, class_id=class_id, session_date=session_date
    ).first()

    if not session:
        return jsonify({"success": True, "data": None}), 200

    return jsonify({"success": True, "data": {"session_id": session.id}}), 200


# Ye API frontend ko batayega ki teacher ko kaunse subjects assigned hain.
@teacher_bp.route("/assignments", methods=["GET"])
@role_required("TEACHER")
def teacher_assignments():
    teacher = _get_current_teacher()

    rows = (
        db.session.query(
            SchoolClass.id.label("class_id"),
            SchoolClass.name.label("class_name"),
            SchoolClass.section,
            Subject.id.label("subject_id"),
            Subject.name.label("subject_name"),
        )
        .join(
            TeacherSubjectAssignment,
            TeacherSubjectAssignment.class_id == SchoolClass.id,
        )
        .join(Subject, Subject.id == TeacherSubjectAssignment.subject_id)
        .filter(TeacherSubjectAssignment.teacher_id == teacher.id)
        .all()
    )

    data = []
    for row in rows:
        data.append(
            {
                "class_id": row.class_id,
                "class_name": row.class_name,
                "section": row.section,
                "subject_id": row.subject_id,
                "subject_name": row.subject_name,
            }
        )

    return jsonify({"success": True, "data": data})


@teacher_bp.route("/face-attendance", methods=["POST"])
@role_required("TEACHER")
def face_attendance():

    teacher = _get_current_teacher()

    class_id = request.form.get("class_id", type=int)
    subject_id = request.form.get("subject_id", type=int)
    session_date = request.form.get("session_date")

    if class_id is None or subject_id is None or not session_date:
        raise APIError("Missing class/subject/date", 400)

    if "image" not in request.files:
        raise APIError("Image required", 400)

    try:
        session_date_obj = datetime.strptime(session_date, "%Y-%m-%d").date()
    except ValueError:
        raise APIError("Invalid date format", 400)

    assigned = TeacherSubjectAssignment.query.filter_by(
        teacher_id=teacher.id, class_id=class_id, subject_id=subject_id
    ).first()

    if not assigned:
        raise APIError("Not authorized for this subject", 403)

    session = AttendanceSession.query.filter_by(
        class_id=class_id, subject_id=subject_id, session_date=session_date_obj
    ).first()

    if not session:
        session = AttendanceSession(
            class_id=class_id,
            subject_id=subject_id,
            teacher_id=teacher.id,
            session_date=session_date_obj,
        )
        db.session.add(session)
        db.session.commit()

    file = request.files["image"]
    file_bytes = np.frombuffer(file.read(), np.uint8)
    captured_image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if captured_image is None:
        raise APIError("Invalid image", 400)

    # Single embedding only
    representation = DeepFace.represent(
        img_path=captured_image,
        model_name="ArcFace",
        detector_backend="opencv",
        enforce_detection=False,
    )[0]

    captured_embedding = np.array(representation["embedding"])

    students = Student.query.filter_by(class_id=class_id).all()

    from scipy.spatial.distance import cosine

    best_match = None
    best_distance = 999

    for student in students:

        if not student.face_embedding:
            continue

        stored_embedding = np.array(json.loads(student.face_embedding))
        distance = cosine(captured_embedding, stored_embedding)

        if distance < best_distance:
            best_distance = distance
            best_match = student

    if not best_match or best_distance > 0.6:
        return jsonify({"matched": False})

    existing = AttendanceRecord.query.filter_by(
        session_id=session.id, student_id=best_match.id
    ).first()

    if not existing:
        db.session.add(
            AttendanceRecord(
                session_id=session.id, student_id=best_match.id, status="PRESENT"
            )
        )
        db.session.commit()

        create_notification(
            user_id=best_match.user_id,
            title="Attendance Marked (Face)",
            message=f"You were marked PRESENT on {session.session_date}.",
            type="success",
        )

    return jsonify(
        {
            "matched": True,
            "student_id": best_match.id,
            "student_name": best_match.user.name,
        }
    )


@teacher_bp.route("/finalize-face-attendance", methods=["POST"])
@role_required("TEACHER")
def finalize_face_attendance():

    teacher = _get_current_teacher()

    class_id = request.json.get("class_id")
    subject_id = request.json.get("subject_id")
    session_date = request.json.get("session_date")

    if not class_id or not subject_id or not session_date:
        raise APIError("Missing data", 400)

    try:
        session_date_obj = datetime.strptime(session_date, "%Y-%m-%d").date()
    except ValueError:
        raise APIError("Invalid date", 400)

    session = AttendanceSession.query.filter_by(
        class_id=class_id,
        subject_id=subject_id,
        session_date=session_date_obj,
        teacher_id=teacher.id,
    ).first()

    if not session:
        raise APIError("Session not found", 404)

    students = Student.query.filter_by(class_id=class_id).all()

    present_ids = {
        r.student_id
        for r in AttendanceRecord.query.filter_by(session_id=session.id).all()
    }

    records_to_add = []

    for student in students:
        if student.id not in present_ids:
            records_to_add.append(
                AttendanceRecord(
                    session_id=session.id, student_id=student.id, status="ABSENT"
                )
            )

    if records_to_add:
        db.session.add_all(records_to_add)
        db.session.commit()

        for record in records_to_add:
            student = Student.query.get(record.student_id)
            if not student:
                continue

            create_notification(
                user_id=student.user_id,
                title="Marked Absent",
                message=f"You were marked ABSENT on {session.session_date}.",
                type="warning"
            )

    return jsonify({"success": True, "message": "Attendance finalized successfully"})


@teacher_bp.route("/academic-assignments", methods=["POST"])
@role_required("TEACHER")
def create_academic_assignment():

    teacher = _get_current_teacher()

    class_id = request.form.get("class_id")
    subject_id = request.form.get("subject_id")
    title = request.form.get("title")
    description = request.form.get("description")
    due_date = request.form.get("due_date")

    if not all([class_id, subject_id, title, due_date]):
        raise APIError("Missing required fields", 400)

    file = request.files.get("file")
    file_path = None

    if file:
        upload_folder = "uploads/assignments"
        os.makedirs(upload_folder, exist_ok=True)

        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

    assignment = AcademicAssignment(
        class_id=class_id,
        subject_id=subject_id,
        teacher_id=teacher.id,
        title=title,
        description=description,
        due_date=datetime.strptime(due_date, "%Y-%m-%d").date(),
        file_path=file_path
    )

    db.session.add(assignment)
    db.session.commit()

    return jsonify({"success": True})

@teacher_bp.route("/academic-assignments/<int:id>", methods=["PUT"])
@role_required("TEACHER")
def update_assignment(id):

    teacher = _get_current_teacher()
    assignment = AcademicAssignment.query.get_or_404(id)

    if assignment.teacher_id != teacher.id:
        raise APIError("Forbidden", 403)

    data = request.json

    assignment.title = data.get("title", assignment.title)
    assignment.description = data.get("description", assignment.description)
    assignment.due_date = datetime.strptime(
        data.get("due_date"), "%Y-%m-%d"
    ).date()

    db.session.commit()

    return jsonify({"success": True})

@teacher_bp.route("/academic-assignments", methods=["GET"])
@role_required("TEACHER")
def list_academic_assignments():

    teacher = _get_current_teacher()

    assignments = AcademicAssignment.query.filter_by(
        teacher_id=teacher.id
    ).order_by(AcademicAssignment.created_at.desc()).all()

    return jsonify({
        "success": True,
        "data": [a.to_dict() for a in assignments]
    })


@teacher_bp.route("/academic-assignments/<int:id>", methods=["DELETE"])
@role_required("TEACHER")
def delete_assignment(id):

    teacher = _get_current_teacher()
    assignment = AcademicAssignment.query.get_or_404(id)

    if assignment.teacher_id != teacher.id:
        raise APIError("Forbidden", 403)

    db.session.delete(assignment)
    db.session.commit()

    return jsonify({"success": True})



@teacher_bp.route("/academic-assignments/<int:id>/submissions", methods=["GET"])
@role_required("TEACHER")
def view_submissions(id):

    subs = AssignmentSubmission.query.filter_by(assignment_id=id).all()

    return jsonify({
        "success": True,
        "data": [
            {
                "student_id": s.student_id,
                "file_path": s.file_path,
                "submitted_at": s.submitted_at
            }
            for s in subs
        ]
    })


@teacher_bp.route("/assignment-calendar", methods=["GET"])
@role_required("TEACHER")
def teacher_assignment_calendar():

    teacher = _get_current_teacher()

    month = request.args.get("month")
    if not month:
        raise APIError("Month required (YYYY-MM)", 400)

    year, month_num = month.split("-")

    start_date = date(int(year), int(month_num), 1)

    if int(month_num) == 12:
        end_date = date(int(year) + 1, 1, 1)
    else:
        end_date = date(int(year), int(month_num) + 1, 1)

    # 🔥 IMPORTANT FIX STARTS HERE
    class_id_raw = request.args.get("class_id")

    query = AcademicAssignment.query.filter(
        AcademicAssignment.teacher_id == teacher.id,
        AcademicAssignment.due_date >= start_date,
        AcademicAssignment.due_date < end_date
    )

    if class_id_raw and class_id_raw.strip() != "":
        class_id = int(class_id_raw)
        query = query.filter(AcademicAssignment.class_id == class_id)

    assignments = query.all()
    # 🔥 IMPORTANT FIX ENDS HERE

    result = []

    for a in assignments:

        total_students = Student.query.filter_by(
            class_id=a.class_id
        ).count()

        submitted_count = AssignmentSubmission.query.filter_by(
            assignment_id=a.id
        ).count()

        result.append({
            "id": a.id,
            "title": a.title,
            "due_date": a.due_date.strftime("%Y-%m-%d"),
            "class_name": a.class_.name,
            "section": a.class_.section,
            "subject_name": a.subject.name,
            "total_students": total_students,
            "submitted_count": submitted_count,
            "pending_count": total_students - submitted_count
        })

    return jsonify({"success": True, "data": result})