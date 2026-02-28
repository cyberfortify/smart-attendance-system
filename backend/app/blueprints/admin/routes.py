"""
Admin routes: create/list/update/delete classes and students.
Admin-only endpoints use role_required('ADMIN').
Input JSON is validated using validate_json decorator where appropriate.
"""

import csv
import io
import os
import cv2
import json
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from deepface import DeepFace
from flask import request, jsonify, Blueprint
from app.utils.security import generate_random_password
from ...extensions import db
from ...models.classes import Class as SchoolClass
from ...models.student import Student
from ...models.user import User
from ...models.teacher_subject_assignments import TeacherSubjectAssignment
from ...models.subject import Subject
from ...models.teacher_classes import TeacherClass
from ...models.teacher import Teacher
from ...models.attendance_session import AttendanceSession
from ...models.attendance_record import AttendanceRecord
from ...models.notification import Notification
from ...models.teacher_attendance import TeacherAttendance
from ...services.auth_service import create_user
from ...utils.decorators import role_required
from ...utils.validators import validate_json
from ...utils.errors import APIError
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case, or_
from flask_caching import Cache
from flask_jwt_extended import get_jwt_identity
from ...utils.notification_helper import create_notification

cache = Cache(config={"CACHE_TYPE": "SimpleCache"})


admin_bp = Blueprint("admin", __name__)

# --------- Admin notifications ----------
@admin_bp.route("/notifications", methods=["GET"])
@role_required("ADMIN")
def get_admin_notifications():
    try:
        user_id = get_jwt_identity()

        notifications = (
            Notification.query.filter_by(user_id=user_id)
            .order_by(Notification.created_at.desc())
            .limit(20)
            .all()
        )

        data = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "time": n.created_at.strftime("%d %b %Y %H:%M"),
                "read": n.is_read,
                "type": n.type,
            }
            for n in notifications
        ]

        return jsonify({"success": True, "data": data})
    except Exception as e:
        print("Error loading notifications:", e)
        raise APIError("Failed to load notifications", status_code=500)

# Mark all notifications as read
@admin_bp.route("/notifications/read", methods=["PATCH"])
@role_required("ADMIN")
def mark_notifications_read():
    try:
        user_id = get_jwt_identity()

        Notification.query.filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True}, synchronize_session=False)

        db.session.commit()

        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        print("Mark read error:", e)
        raise APIError("Failed to update notifications", status_code=500)

# ---------- Class create + list + update + delete ----------
@admin_bp.route("/classes", methods=["POST"])
@role_required("ADMIN")
@validate_json({"name": str, "section": None, "year": None})
def create_class():
    """
    Create a class.
    JSON: { "name": str, "section": str (optional), "year": int (optional) }
    """
    data = request.get_json() or {}
    name = data.get("name")
    section = data.get("section")
    year = data.get("year")
    try:
        if year is not None:
            # allow string numbers too (basic coercion)
            year = int(year)
    except ValueError:
        raise APIError("Field 'year' must be an integer", status_code=400)

    klass = SchoolClass(name=name, section=section, year=year)
    db.session.add(klass)
    db.session.commit()
    admin_user_id = get_jwt_identity()

    create_notification(
        user_id=admin_user_id,
        title="Class Created",
        message=f"Class {klass.name} created successfully.",
        type="success"
    )

    return jsonify({"success": True, "data": {"id": klass.id, "name": klass.name}}), 201


@admin_bp.route("/classes", methods=["GET"])
@role_required("ADMIN")
def list_classes():
    classes = SchoolClass.query.all()
    data = [
        {"id": c.id, "name": c.name, "section": c.section, "year": c.year}
        for c in classes
    ]
    return jsonify({"success": True, "data": data})


@admin_bp.route("/classes/<int:class_id>", methods=["PUT"])
@role_required("ADMIN")
@validate_json({"name": None, "section": None, "year": None})
def update_class(class_id):
    klass = SchoolClass.query.get(class_id)
    if not klass:
        raise APIError("Class not found", status_code=404)
    data = request.get_json() or {}
    if "year" in data and data["year"] not in (None, ""):
        try:
            klass.year = int(data["year"])
        except (ValueError, TypeError):
            raise APIError("Field 'year' must be integer", status_code=400)
    if "name" in data and data["name"] is not None:
        klass.name = data["name"]
    klass.section = data.get("section", klass.section)
    db.session.commit()
    return jsonify(
        {
            "success": True,
            "data": {
                "id": klass.id,
                "name": klass.name,
                "section": klass.section,
                "year": klass.year,
            },
        }
    )


@admin_bp.route("/classes/<int:class_id>", methods=["DELETE"])
@role_required("ADMIN")
def delete_class(class_id):
    klass = SchoolClass.query.get(class_id)
    if not klass:
        raise APIError("Class not found", status_code=404)
    db.session.delete(klass)
    db.session.commit()
    return jsonify({"success": True, "message": "Class deleted"})


# ---------- Student create + list + update + delete ----------
@admin_bp.route("/students", methods=["POST"])
@role_required("ADMIN")
@validate_json(
    {"name": str, "email": str, "password": str, "roll_no": None, "class_id": None}
)
def create_student():
    """
    Create student user and student profile.
    JSON: { "name": str, "email": str, "password": str, "roll_no": str (optional), "class_id": int (optional) }
    """
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    roll_no = data.get("roll_no")

    # Normalize class_id: treat empty string or whitespace as None
    raw_class_id = data.get("class_id", None)
    class_id = None
    if raw_class_id is not None and str(raw_class_id).strip() != "":
        try:
            class_id = int(raw_class_id)
        except (ValueError, TypeError):
            raise APIError("Field 'class_id' must be an integer", status_code=400)

    existing = User.query.filter_by(email=email).first()
    if existing:
        raise APIError("Email already exists", status_code=400)

    try:
        # create_user should return a User object and handle password hashing
        user = create_user(name=name, email=email, password=password, role="STUDENT")
        db.session.flush()
        student = Student(user_id=user.id, roll_no=roll_no, class_id=class_id)
        db.session.add(student)
        db.session.commit()
        admin_user_id = get_jwt_identity()

        create_notification(
            user_id=admin_user_id,
            title="New Student Registered",
            message=f"{user.name} has been added.",
            type="success"
        )

    except APIError:
        # re-raise APIError so central handler can manage it
        raise
    except Exception as e:
        db.session.rollback()
        # Log the exception on server (print or logger)
        print("Error creating student:", e)
        # Return generic message to client
        raise APIError("Failed to create student due to server error", status_code=500)

    return jsonify({"success": True, "data": student.to_dict()}), 201


@admin_bp.route("/students", methods=["GET"])
@role_required("ADMIN")
def list_students():
    from sqlalchemy import or_

    q = request.args.get("q", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 25, type=int)

    raw_class_id = request.args.get("class_id")

    print("RAW ARGS:", dict(request.args))
    print("RAW class_id:", raw_class_id, type(raw_class_id))

    base_query = Student.query

    #  SEARCH
    if q:
        like = f"%{q}%"
        base_query = base_query.join(User).filter(
            or_(
                User.name.ilike(like),
                User.email.ilike(like),
                Student.roll_no.ilike(like),
            )
        )

    #  CLASS FILTER (HARD SAFE)
    if raw_class_id not in (None, "", "undefined", "null"):
        try:
            class_id = int(raw_class_id)
            base_query = base_query.filter(Student.class_id == class_id)
            print("APPLIED class_id filter:", class_id)
        except ValueError:
            print("INVALID class_id RECEIVED")

    pagination = base_query.order_by(Student.id).paginate(
        page=page, per_page=per_page, error_out=False
    )

    data = []
    for s in pagination.items:
        data.append(
            {
                "id": s.id,
                "name": s.user.name,
                "email": s.user.email,
                "roll_no": s.roll_no,
                "class_id": s.class_id,
            }
        )

    total = Student.query.count()
    with_class = Student.query.filter(Student.class_id.isnot(None)).count()
    start_month = datetime.utcnow().replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )
    new_this_month = Student.query.filter(Student.created_at >= start_month).count()

    return {
        "data": data,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "active_count": total,
        "with_class_count": with_class,
        "new_this_month_count": new_this_month,
    }, 200


@admin_bp.route("/students/import", methods=["POST"])
@role_required("ADMIN")
def import_students_csv():
    if "file" not in request.files:
        raise APIError("CSV file missing", status_code=400)

    f = request.files["file"]

    stream = io.StringIO(f.read().decode("utf-8-sig"))
    reader = csv.DictReader(stream)

    required = {"name", "email", "roll_no", "class_id"}
    headers = set(h.lower().strip() for h in reader.fieldnames or [])
    if not required.issubset(headers):
        raise APIError(
            f"CSV must contain columns: {', '.join(required)}", status_code=400
        )

    created = 0
    updated = 0
    skipped = 0
    errors = []

    try:
        for idx, row in enumerate(reader, start=2):
            try:
                name = row["name"].strip()
                email = row["email"].strip().lower()
                roll_no = row["roll_no"].strip()
                class_id = int(row["class_id"])
                password = row.get("password") or "student123"

                if not name or not email:
                    raise ValueError("Missing name/email")

                user = User.query.filter_by(email=email).first()

                if not user:
                    user = create_user(
                        name=name, email=email, password=password, role="STUDENT"
                    )
                    db.session.flush()
                    created += 1
                else:
                    updated += 1

                student = Student.query.filter_by(user_id=user.id).first()
                if not student:
                    student = Student(
                        user_id=user.id, roll_no=roll_no, class_id=class_id
                    )
                    db.session.add(student)
                else:
                    student.roll_no = roll_no
                    student.class_id = class_id

            except Exception as row_err:
                skipped += 1
                errors.append({"row": idx, "error": str(row_err)})
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print("IMPORT FAILED:", e)
        raise APIError("Bulk import failed", status_code=500)

    return (
        jsonify(
            {
                "success": True,
                "message": "Import completed",
                "created_count": created,
                "updated_count": updated,
                "skipped_count": skipped,
                "errors": errors,
            }
        ),
        200,
    )


@admin_bp.route("/students/<int:student_id>", methods=["PUT"])
@role_required("ADMIN")
@validate_json(
    {"name": None, "email": None, "password": None, "roll_no": None, "class_id": None}
)
def update_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        raise APIError("Student not found", status_code=404)
    data = request.get_json() or {}
    user = student.user

    if "name" in data and data["name"] is not None:
        user.name = data["name"]
    if "email" in data and data["email"] is not None:
        # check duplicate
        existing = User.query.filter(
            User.email == data["email"], User.id != user.id
        ).first()
        if existing:
            raise APIError("Email already in use", status_code=400)
        user.email = data["email"]
    if "password" in data and data["password"]:
        user.set_password(data["password"])
    if "roll_no" in data and data["roll_no"] is not None:
        student.roll_no = data["roll_no"]
    if "class_id" in data and data["class_id"] not in (None, ""):
        try:
            student.class_id = int(data["class_id"])
        except (ValueError, TypeError):
            raise APIError("Invalid class_id", status_code=400)

    db.session.commit()
    return jsonify({"success": True, "data": student.to_dict()})


@admin_bp.route("/students/stats", methods=["GET"])
@role_required("ADMIN")
def student_stats():
    total = Student.query.count()
    with_class = Student.query.filter(Student.class_id.isnot(None)).count()

    start_month = datetime.utcnow().date().replace(day=1)
    new_this_month = Student.query.filter(Student.created_at >= start_month).count()

    return jsonify(
        {
            "success": True,
            "data": {
                "total": total,
                "with_class": with_class,
                "new_this_month": new_this_month,
            },
        }
    )


@admin_bp.route("/students/<int:student_id>", methods=["DELETE"])
@role_required("ADMIN")
def delete_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        raise APIError("Student not found", status_code=404)
    user = student.user
    db.session.delete(student)
    if user:
        db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True, "message": "Student and user deleted"})


@admin_bp.route("/export/students", methods=["GET"])
@role_required("ADMIN")
def export_students_csv():
    """
    Export students as CSV. Supports same query params as list_students.
    """
    q = request.args.get("q", type=str)
    class_id = request.args.get("class_id", type=int)

    query = Student.query.join(User, Student.user).order_by(Student.id)
    if class_id:
        query = query.filter(Student.class_id == class_id)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (User.name.ilike(like))
            | (User.email.ilike(like))
            | (Student.roll_no.ilike(like))
        )

    students = query.all()

    # build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["student_id", "name", "email", "roll_no", "class_id"])
    for s in students:
        writer.writerow(
            [
                s.id,
                s.user.name if s.user else "",
                s.user.email if s.user else "",
                s.roll_no or "",
                s.class_id or "",
            ]
        )
    output.seek(0)
    return (
        output.getvalue(),
        200,
        {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=students_export.csv",
        },
    )


# ---------- Teacher create + list ----------
@admin_bp.route("/teachers", methods=["GET"])
@role_required("ADMIN")
def list_teachers():
    users = User.query.filter_by(role="TEACHER").all()
    data = []
    for u in users:
        teacher_profile = getattr(u, "teacher_profile", None)
        data.append(
            {
                "user_id": u.id,
                "teacher_profile_id": teacher_profile.id if teacher_profile else None,
                "name": u.name,
                "email": u.email,
            }
        )
    return jsonify({"success": True, "data": data})


@admin_bp.route("/teachers", methods=["POST"])
@role_required("ADMIN")
@validate_json({"name": str, "email": str, "password": str})
def create_teacher():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if User.query.filter_by(email=email).first():
        raise APIError("Email already exists", status_code=400)

    try:
        user = create_user(name=name, email=email, password=password, role="TEACHER")
        db.session.flush()
        teacher = Teacher(user_id=user.id, employee_id=data.get("employee_id"))
        db.session.add(teacher)
        db.session.commit()

        admin_user_id = get_jwt_identity()

        create_notification(
            user_id=admin_user_id,
            title="New Teacher Added",
            message=f"{user.name} joined as Teacher.",
            type="success"
        )


    except Exception as e:
        db.session.rollback()
        print("Error creating teacher:", e)
        raise APIError("Failed to create teacher", status_code=500)

    return (
        jsonify(
            {
                "success": True,
                "data": {
                    "user_id": user.id,
                    "teacher_profile_id": teacher.id,
                    "name": user.name,
                    "email": user.email,
                },
            }
        ),
        201,
    )


@admin_bp.route("/teachers/import", methods=["POST"])
@role_required("ADMIN")
def import_teachers_csv():

    if "file" not in request.files:
        raise APIError("CSV file missing", status_code=400)

    f = request.files["file"]
    stream = io.StringIO(f.read().decode("utf-8-sig"))
    reader = csv.DictReader(stream)

    required = {"name", "email", "employee_id"}
    headers = set(h.lower().strip() for h in reader.fieldnames or [])

    if not required.issubset(headers):
        raise APIError(
            "CSV must contain columns: name, email, employee_id",
            status_code=400,
        )

    created = 0
    updated = 0
    skipped = 0
    errors = []

    try:
        for idx, row in enumerate(reader, start=2):
            try:
                name = row["name"].strip()
                email = row["email"].strip().lower()
                employee_id = row["employee_id"].strip()
                password = row.get("password") or generate_random_password()

                if not name or not email:
                    raise ValueError("Missing name/email")

                user = User.query.filter_by(email=email).first()

                if not user:
                    user = create_user(
                        name=name,
                        email=email,
                        password=password,
                        role="TEACHER"
                    )
                    db.session.flush()
                    created += 1
                else:
                    updated += 1

                teacher = Teacher.query.filter_by(user_id=user.id).first()

                if not teacher:
                    teacher = Teacher(
                        user_id=user.id,
                        employee_id=employee_id
                    )
                    db.session.add(teacher)
                else:
                    teacher.employee_id = employee_id

            except Exception as row_err:
                skipped += 1
                errors.append({"row": idx, "error": str(row_err)})

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print("TEACHER IMPORT FAILED:", e)
        raise APIError("Bulk teacher import failed", status_code=500)

    return jsonify(
        {
            "success": True,
            "message": "Teacher import completed",
            "created_count": created,
            "updated_count": updated,
            "skipped_count": skipped,
            "errors": errors,
        }
    ), 200



@admin_bp.route("/export/teachers", methods=["GET"])
@role_required("ADMIN")
def export_teachers_csv():

    teachers = User.query.filter_by(role="TEACHER").all()

    output = io.StringIO()
    writer = csv.writer(output)

    # CSV Header
    writer.writerow(["teacher_id", "name", "email", "employee_id"])

    for u in teachers:
        teacher_profile = Teacher.query.filter_by(user_id=u.id).first()

        writer.writerow([
            teacher_profile.id if teacher_profile else "",
            u.name,
            u.email,
            teacher_profile.employee_id if teacher_profile else "",
        ])

    output.seek(0)

    return (
        output.getvalue(),
        200,
        {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=teachers_export.csv",
        },
    )


@admin_bp.route("/teacher-classes", methods=["POST"])
@role_required("ADMIN")
def assign_teacher_to_class():
    """
    Assign a teacher to a class.
    Body: { "teacher_id": int, "class_id": int }
    """
    data = request.get_json() or {}
    teacher_id = data.get("teacher_id")
    class_id = data.get("class_id")

    if not teacher_id or not class_id:
        raise APIError("teacher_id and class_id are required", status_code=400)

    try:
        teacher = Teacher.query.filter_by(user_id=teacher_id).first()
        if not teacher:
            raise APIError("Teacher not found", status_code=404)

        klass = SchoolClass.query.get(int(class_id))
        if not klass:
            raise APIError("Class not found", status_code=404)

        # Prevent duplicate mapping
        existing = TeacherClass.query.filter_by(
            teacher_id=teacher.id, class_id=klass.id
        ).first()
        if existing:
            return jsonify({"success": True, "data": existing.to_dict()})

        mapping = TeacherClass(teacher_id=teacher.id, class_id=klass.id)
        db.session.add(mapping)
        db.session.commit()
        create_notification(
            user_id=teacher.user_id,
            title="Class Assigned",
            message=f"You have been assigned to class {klass.name}.",
            type="info"
        )
        return jsonify({"success": True, "data": mapping.to_dict()}), 201

    except APIError:
        # re-raise controlled APIError
        raise
    except Exception as e:
        # log server-side
        print("Error in assign_teacher_to_class:", e)
        db.session.rollback()
        raise APIError("Failed to assign teacher to class", status_code=500)


@admin_bp.route("/teacher-classes", methods=["GET"])
@role_required("ADMIN")
def list_teacher_classes():
    """
    Return list of teacher<->class mappings with extra details:
    [{ id, teacher_id, teacher_name, class_id, class_name, section }]
    """
    try:
        mappings = TeacherClass.query.all()
        out = []
        for m in mappings:
            teacher = m.teacher  # relationship exists
            klass = m.klass
            teacher_name = None
            if teacher and getattr(teacher, "user", None):
                teacher_name = teacher.user.name
            elif teacher:
                # fallback: fetch user via User model if relationship missing
                u = User.query.filter_by(id=teacher.user_id).first()
                if u:
                    teacher_name = u.name

            out.append(
                {
                    "id": m.id,
                    "teacher_id": m.teacher_id,
                    "teacher_name": teacher_name,
                    "class_id": m.class_id,
                    "class_name": klass.name if klass else None,
                    "section": klass.section if klass else None,
                    "year": klass.year if klass else None,
                }
            )
        return jsonify({"success": True, "data": out})
    except Exception as e:
        # log server-side for debugging, then return a controlled error
        print("Error in list_teacher_classes:", e)
        raise APIError("Failed to load teacher-class mappings", status_code=500)


@admin_bp.route("/teacher-classes", methods=["DELETE"])
@role_required("ADMIN")
def unassign_teacher_from_class():
    """
    Unassign mapping by id or by teacher_id+class_id in query.
    Query params optional: id OR teacher_id & class_id
    """
    mapping_id = request.args.get("id", type=int)
    teacher_id = request.args.get("teacher_id", type=int)
    class_id = request.args.get("class_id", type=int)

    if mapping_id:
        mapping = TeacherClass.query.get(mapping_id)
    elif teacher_id and class_id:
        mapping = TeacherClass.query.filter_by(
            teacher_id=teacher_id, class_id=class_id
        ).first()
    else:
        raise APIError("Provide mapping id OR teacher_id and class_id", status_code=400)

    if not mapping:
        raise APIError("Mapping not found", status_code=404)

    db.session.delete(mapping)
    db.session.commit()
    return jsonify({"success": True, "message": "Mapping deleted"})


# --------- Admin analytics ----------
@admin_bp.route("/analytics", methods=["GET"])
@role_required("ADMIN")
def admin_analytics():
    """
    Returns:
      - total_students
      - total_teachers
      - sessions_last_30 (count)
      - avg_attendance_last_30 (percentage)
    """
    try:
        total_students = Student.query.count()
        total_teachers = Teacher.query.count()

        thirty = datetime.utcnow().date() - timedelta(days=30)
        sessions_count = AttendanceSession.query.filter(
            AttendanceSession.session_date >= thirty
        ).count()

        # average attendance percentage across sessions in last 30 days
        subq = (
            db.session.query(
                AttendanceRecord.session_id.label("sid"),
                func.sum(
                    case((AttendanceRecord.status == "PRESENT", 1), else_=0)
                ).label("present"),
                func.count(AttendanceRecord.id).label("total"),
            )
            .join(
                AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id
            )
            .filter(AttendanceSession.session_date >= thirty)
            .group_by(AttendanceRecord.session_id)
            .subquery()
        )

        rows = db.session.query(
            func.avg((subq.c.present * 1.0) / subq.c.total * 100)
        ).all()
        avg_attendance = float(rows[0][0] or 0.0)

        return jsonify(
            {
                "success": True,
                "data": {
                    "total_students": total_students,
                    "total_teachers": total_teachers,
                    "sessions_last_30": sessions_count,
                    "avg_attendance_last_30": round(avg_attendance, 2),
                },
            }
        )
    except Exception as e:
        print("Analytics error:", e)
        raise APIError("Failed to compute analytics", status_code=500)


@admin_bp.route("/analytics/attendance-trend", methods=["GET"])
@role_required("ADMIN")
def attendance_trend():
    period = request.args.get("period", "30d")

    # Period mapping
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = days_map.get(period, 30)

    try:
        today = datetime.utcnow().date()
        period_start = today - timedelta(days=days - 1)

        # Same logic as before, bas days change
        subq = (
            db.session.query(
                AttendanceRecord.session_id.label("sid"),
                func.sum(
                    case((AttendanceRecord.status == "PRESENT", 1), else_=0)
                ).label("present"),
                func.count(AttendanceRecord.id).label("total"),
                AttendanceSession.session_date.label("session_date"),
            )
            .join(
                AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id
            )
            .filter(AttendanceSession.session_date >= period_start)
            .filter(AttendanceSession.session_date <= today)
            .group_by(AttendanceRecord.session_id, AttendanceSession.session_date)
            .subquery()
        )

        rows = (
            db.session.query(
                subq.c.session_date,
                func.avg((subq.c.present * 1.0) / subq.c.total * 100).label("avg_pct"),
            )
            .group_by(subq.c.session_date)
            .order_by(subq.c.session_date)
            .all()
        )

        day_to_pct = {r.session_date: float(r.avg_pct or 0.0) for r in rows}

        labels = []
        values = []
        for i in range(days):
            d = period_start + timedelta(days=i)
            labels.append(d.strftime("%Y-%m-%d"))
            values.append(day_to_pct.get(d, 0.0))

        return jsonify({"success": True, "data": {"labels": labels, "values": values}})
    except Exception as e:
        print("Attendance trend error:", e)
        raise APIError("Failed to compute attendance trend", status_code=500)


@admin_bp.route("/analytics/attendance-pie", methods=["GET"])
@role_required("ADMIN")
def attendance_pie():
    try:
        period = request.args.get("period", "30d")
        days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
        days = days_map.get(period, 30)

        today = datetime.utcnow().date()
        start_date = today - timedelta(days=days - 1)

        present_count = (
            db.session.query(func.count(AttendanceRecord.id))
            .join(
                AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id
            )
            .filter(
                AttendanceSession.session_date >= start_date,
                AttendanceSession.session_date <= today,
                AttendanceRecord.status == "PRESENT",
            )
            .scalar()
            or 0
        )

        absent_count = (
            db.session.query(func.count(AttendanceRecord.id))
            .join(
                AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id
            )
            .filter(
                AttendanceSession.session_date >= start_date,
                AttendanceSession.session_date <= today,
                AttendanceRecord.status == "ABSENT",
            )
            .scalar()
            or 0
        )

        total = present_count + absent_count

        if total > 0:
            present_pct = round((present_count / total) * 100, 1)
            absent_pct = round((absent_count / total) * 100, 1)
        else:
            present_pct = 0.0
            absent_pct = 0.0

        return jsonify(
            {
                "success": True,
                "data": {
                    "present": present_pct,
                    "absent": absent_pct,
                    "present_count": present_count,
                    "absent_count": absent_count,
                    "total": total,
                },
            }
        )

    except Exception as e:
        print("Attendance pie error:", e)
        raise APIError("Failed to compute pie data", status_code=500)


@admin_bp.route("/analytics/active-sessions", methods=["GET"])
@role_required("ADMIN")
def active_sessions():
    """
    Return today's active users + 7-day trend.
    Response:
    {
      "success": true,
      "data": {
        "today": 145,
        "trend": [120, 135, 128, 142, 150, 138, 145]
      }
    }
    """
    try:
        today = datetime.utcnow().date()
        week_days = [(today - timedelta(days=i)).isoformat()[:10] for i in range(7)]

        # Today ke unique students jo attendance me hain
        today_active = (
            db.session.query(func.count(func.distinct(AttendanceRecord.student_id)))
            .join(
                AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id
            )
            .filter(
                AttendanceSession.session_date == today,
                AttendanceRecord.status == "PRESENT",
            )
            .scalar()
            or 0
        )

        # 7-day trend
        trend = []
        for day_str in week_days:
            day_active = (
                db.session.query(func.count(func.distinct(AttendanceRecord.student_id)))
                .join(
                    AttendanceSession,
                    AttendanceSession.id == AttendanceRecord.session_id,
                )
                .filter(
                    AttendanceSession.session_date == day_str,
                    AttendanceRecord.status == "PRESENT",
                )
                .scalar()
                or 0
            )
            trend.append(int(day_active))

        return jsonify(
            {"success": True, "data": {"today": int(today_active), "trend": trend}}
        )
    except Exception as e:
        print("Active sessions error:", e)
        raise APIError("Failed to compute active sessions", status_code=500)


@admin_bp.route("/analytics/class-performance", methods=["GET"])
@role_required("ADMIN")
def class_performance():
    period = request.args.get("period", "30d")
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = days_map.get(period, 30)

    try:
        today = datetime.utcnow().date()
        period_start = today - timedelta(days=days - 1)

        subq = (
            db.session.query(
                AttendanceSession.class_id.label("class_id"),
                func.sum(
                    case((AttendanceRecord.status == "PRESENT", 1), else_=0)
                ).label("present"),
                func.count(AttendanceRecord.id).label("total"),
            )
            .join(AttendanceRecord, AttendanceRecord.session_id == AttendanceSession.id)
            .filter(AttendanceSession.session_date >= period_start)
            .filter(AttendanceSession.session_date <= today)
            .group_by(AttendanceSession.class_id)
            .subquery()
        )

        rows = (
            db.session.query(
                SchoolClass.id,
                SchoolClass.name,
                SchoolClass.section,
                func.count(Student.id).label("student_count"),
                subq.c.present,
                subq.c.total,
            )
            .outerjoin(Student, Student.class_id == SchoolClass.id)
            .outerjoin(subq, subq.c.class_id == SchoolClass.id)
            .group_by(
                SchoolClass.id,
                SchoolClass.name,
                SchoolClass.section,
                subq.c.present,
                subq.c.total,
            )
            .all()
        )

        out = []
        for cls_id, name, section, student_count, present, total in rows:
            from decimal import Decimal

            present = present or Decimal(0)
            total = total or Decimal(0)

            if total > 0:
                pct = (present / total) * Decimal(100)
                pct = round(float(pct), 2)
            else:
                pct = 0.0

            out.append(
                {
                    "class_id": cls_id,
                    "name": f"{name}{' ' + section if section else ''}",
                    "attendance": pct,
                    "student_count": int(student_count or 0),
                }
            )

        return jsonify({"success": True, "data": out})

    except Exception as e:
        print("Class performance error:", e)
        raise APIError("Failed to compute class performance", status_code=500)


# --------- Admin activity feed ----------
@admin_bp.route("/activity", methods=["GET"])
@role_required("ADMIN")
def admin_activity():
    # latest 3 students by id
    students = Student.query.order_by(Student.id.desc()).limit(3).all()
    # latest 2 sessions by id/date
    sessions = (
        AttendanceSession.query.order_by(AttendanceSession.session_date.desc())
        .limit(2)
        .all()
    )

    items = []

    for s in students:
        name = None
        if getattr(s, "user", None):
            name = s.user.name
        items.append(
            {
                "text": f"New student registration - {name or 'Unknown'}",
                "time": "recently",
            }
        )

    for sess in sessions:
        items.append(
            {
                "text": f"Attendance session for class {sess.class_id}",
                "time": str(sess.session_date),
            }
        )

    return jsonify({"success": True, "data": items[:5]})


# --------- Subject create + list + update + delete ----------
@admin_bp.route("/subjects", methods=["POST"])
@role_required("ADMIN")
def create_subject():
    from ...models.subject import Subject

    data = request.get_json() or {}

    name = data.get("name")
    class_id = data.get("class_id")

    if not name or not class_id:
        raise APIError("name and class_id required", 400)

    subject = Subject(name=name, class_id=class_id)
    db.session.add(subject)
    db.session.commit()

    admin_user_id = get_jwt_identity()

    create_notification(
        user_id=admin_user_id,  
        title="Subject Created",
        message=f"{subject.name} added to class.",
        type="success"
    )

    return jsonify({"success": True, "data": subject.to_dict()}), 201


# List subjects with class details
@admin_bp.route("/subjects", methods=["GET"])
@role_required("ADMIN")
def list_subjects():
    from ...models.subject import Subject

    subjects = Subject.query.all()
    return jsonify({"success": True, "data": [s.to_dict() for s in subjects]})


# ---------- Delete subject ----------
@admin_bp.route("/subjects/<int:subject_id>", methods=["DELETE"])
@role_required("ADMIN")
def delete_subject(subject_id):
    from ...models.subject import Subject

    subject = Subject.query.get(subject_id)
    if not subject:
        raise APIError("Subject not found", 404)

    db.session.delete(subject)
    db.session.commit()

    return jsonify({"success": True, "message": "Subject deleted"})


# ---------- Teacher-subject assignment ----------
@admin_bp.route("/teacher-subjects", methods=["POST"])
@role_required("ADMIN")
def assign_teacher_subject():
    """
    Assign subject to teacher for specific class.
    Body: { teacher_id, class_id, subject_id }
    """
    data = request.get_json() or {}

    teacher_id = data.get("teacher_id")
    class_id = data.get("class_id")
    subject_id = data.get("subject_id")

    if not teacher_id or not class_id or not subject_id:
        raise APIError("teacher_id, class_id and subject_id are required", 400)

    teacher = Teacher.query.filter_by(user_id=teacher_id).first()
    if not teacher:
        raise APIError("Teacher not found", 404)

    klass = SchoolClass.query.get(class_id)
    if not klass:
        raise APIError("Class not found", 404)

    subject = Subject.query.filter_by(id=subject_id, class_id=class_id).first()
    if not subject:
        raise APIError("Subject not found in this class", 404)

    existing = TeacherSubjectAssignment.query.filter_by(
        teacher_id=teacher.id, class_id=class_id, subject_id=subject_id
    ).first()

    if existing:
        return jsonify({"success": True, "message": "Already assigned"})

    assignment = TeacherSubjectAssignment(
        teacher_id=teacher.id, class_id=class_id, subject_id=subject_id
    )

    db.session.add(assignment)
    db.session.commit()

    create_notification(
        user_id=teacher.user_id,
        title="New Subject Assigned",
        message=f"You have been assigned to Class {klass.name} - {subject.name}",
        type="info"
    )

    return (
        jsonify(
            {
                "success": True,
                "data": {
                    "teacher_id": teacher.id,
                    "class_id": class_id,
                    "subject_id": subject_id,
                },
            }
        ),
        201,
    )

# ---------- Delete teacher-subject assignment ----------
@admin_bp.route("/teacher-subjects/<int:assignment_id>", methods=["DELETE"])
@role_required("ADMIN")
def delete_teacher_subject(assignment_id):

    assignment = TeacherSubjectAssignment.query.get(assignment_id)

    if not assignment:
        raise APIError("Assignment not found", 404)

    db.session.delete(assignment)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Teacher subject assignment deleted successfully"
    })

@admin_bp.route("/students/<int:student_id>/register-face", methods=["POST"])
@role_required("ADMIN")
def register_student_face(student_id):

    student = Student.query.get(student_id)
    if not student:
        raise APIError("Student not found", 404)

    if "image" not in request.files:
        raise APIError("Image required", 400)

    file = request.files["image"]

    try:
        # Convert image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if image is None:
            raise APIError("Invalid image", 400)

        # Convert to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Convert to MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)

        # Load face detection model
        model_path = os.path.join("models", "blaze_face_short_range.tflite")

        base_options = python.BaseOptions(model_asset_path=model_path)

        options = vision.FaceDetectorOptions(
            base_options=base_options, running_mode=vision.RunningMode.IMAGE
        )

        detector = vision.FaceDetector.create_from_options(options)

        detection_result = detector.detect(mp_image)

        if not detection_result.detections:
            raise APIError("No face detected", 400)

        # Get first face
        bbox = detection_result.detections[0].bounding_box

        x, y = bbox.origin_x, bbox.origin_y
        w, h = bbox.width, bbox.height

        face_crop = image[y : y + h, x : x + w]

        if face_crop.size == 0:
            raise APIError("Face crop failed", 400)

        upload_dir = os.path.join("uploads", "faces")
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, f"student_{student.id}.jpg")

        cv2.imwrite(file_path, face_crop)

        student.face_image_path = file_path
        student.face_registered_at = datetime.utcnow()
        db.session.commit()

        embedding = DeepFace.represent(
            img_path=file_path, model_name="ArcFace", enforce_detection=False
        )[0]["embedding"]

        student.face_embedding = json.dumps(embedding)
        db.session.commit()

        return jsonify({"success": True, "message": "Face registered successfully"})

    except APIError:
        raise

    except Exception as e:
        db.session.rollback()
        print("Face registration error:", e)
        raise APIError("Face registration failed", 500)


# ---------- List teacher-subject assignments ----------
@admin_bp.route("/teacher-subjects", methods=["GET"])
@role_required("ADMIN")
def list_teacher_subjects():
    from ...models.teacher_subject_assignments import TeacherSubjectAssignment
    from ...models.teacher import Teacher
    from ...models.classes import Class as SchoolClass
    from ...models.subject import Subject
    from ...models.user import User

    assignments = TeacherSubjectAssignment.query.all()

    data = []

    for a in assignments:
        teacher = Teacher.query.get(a.teacher_id)
        user = User.query.get(teacher.user_id) if teacher else None
        klass = SchoolClass.query.get(a.class_id)
        subject = Subject.query.get(a.subject_id)

        data.append(
            {
                "id": a.id,
                "teacher_id": a.teacher_id,
                "teacher_name": user.name if user else None,
                "class_id": a.class_id,
                "class_name": klass.name if klass else None,
                "section": klass.section if klass else None,
                "subject_id": a.subject_id,
                "subject_name": subject.name if subject else None,
            }
        )

    return jsonify({"success": True, "data": data})



@admin_bp.route("/teachers/<int:teacher_id>/register-face", methods=["POST"])
@role_required("ADMIN")
def register_teacher_face(teacher_id):

    teacher = Teacher.query.get(teacher_id)
    if not teacher:
        raise APIError("Teacher not found", 404)

    if "image" not in request.files:
        raise APIError("Image required", 400)

    file = request.files["image"]

    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if image is None:
            raise APIError("Invalid image", 400)

        # Save face image
        upload_dir = os.path.join("uploads", "faces")
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, f"teacher_{teacher.id}.jpg")
        cv2.imwrite(file_path, image)

        # Generate embedding
        embedding = DeepFace.represent(
            img_path=file_path,
            model_name="ArcFace",
            enforce_detection=False
        )[0]["embedding"]

        teacher.face_embedding = json.dumps(embedding)
        teacher.face_registered_at = datetime.utcnow()

        db.session.commit()

        return jsonify({"success": True, "message": "Teacher face registered successfully"})

    except Exception as e:
        db.session.rollback()
        print("Teacher face registration error:", e)
        raise APIError("Face registration failed", 500)