"""
Admin routes: create/list/update/delete classes and students.
Admin-only endpoints use role_required('ADMIN').
Input JSON is validated using validate_json decorator where appropriate.
"""
import csv
import io
from flask import request, jsonify
from app.utils.security import generate_random_password
from ...extensions import db
from ...models.classes import Class as SchoolClass
from ...models.student import Student
from ...models.user import User
from ...services.auth_service import create_user
from ...utils.decorators import role_required
from ...utils.validators import validate_json
from ...utils.errors import APIError
from flask import Blueprint
from ...models.teacher_classes import TeacherClass
from ...models.teacher import Teacher
from datetime import datetime, timedelta
from ...models.attendance_session import AttendanceSession
from ...models.attendance_record import AttendanceRecord
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, case,or_
from flask_caching import Cache
cache = Cache(config={"CACHE_TYPE": "SimpleCache"})


admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/notifications", methods=["GET"])
@role_required("ADMIN")
def admin_notifications():
    """
    Simple admin notifications:
    - Latest 3 students
    - Latest 2 attendance sessions
    """
    try:
        items = []

        # Latest students
        students = Student.query.order_by(Student.id.desc()).limit(3).all()
        for s in students:
            name = s.user.name if getattr(s, "user", None) else "New student"
            items.append({
                "id": f"student-{s.id}",
                "title": "New student registered",
                "message": name,
                "time": "recently",
                "read": False,
            })

        # Latest sessions
        sessions = AttendanceSession.query.order_by(
            AttendanceSession.session_date.desc()
        ).limit(2).all()
        for sess in sessions:
            items.append({
                "id": f"session-{sess.id}",
                "title": "Attendance session completed",
                "message": f"Class {sess.class_id}",
                "time": str(sess.session_date),
                "read": False,
            })

        # Max 5 items
        return jsonify({"success": True, "data": items[:5]})
    except Exception as e:
        print("Notifications error:", e)
        raise APIError("Failed to load notifications", status_code=500)


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
    return jsonify({"success": True, "data": {"id": klass.id, "name": klass.name}}), 201


@admin_bp.route("/classes", methods=["GET"])
@role_required("ADMIN")
def list_classes():
    classes = SchoolClass.query.all()
    data = [{"id": c.id, "name": c.name, "section": c.section, "year": c.year} for c in classes]
    return jsonify({"success": True, "data": data})


# ---------- Class update ----------

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
    return jsonify({"success": True, "data": {"id": klass.id, "name": klass.name, "section": klass.section, "year": klass.year}})


@admin_bp.route("/classes/<int:class_id>", methods=["DELETE"])
@role_required("ADMIN")
def delete_class(class_id):
    klass = SchoolClass.query.get(class_id)
    if not klass:
        raise APIError("Class not found", status_code=404)
    db.session.delete(klass)
    db.session.commit()
    return jsonify({"success": True, "message": "Class deleted"})


# Student create + list + update + delete
@admin_bp.route("/students", methods=["POST"])
@role_required("ADMIN")
@validate_json({"name": str, "email": str, "password": str, "roll_no": None, "class_id": None})
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

# admin/routes.py (example)
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
        page=page,
        per_page=per_page,
        error_out=False
    )

    data = []
    for s in pagination.items:
        data.append({
            "id": s.id,
            "name": s.user.name,
            "email": s.user.email,
            "roll_no": s.roll_no,
            "class_id": s.class_id,
        })

    return {
        "data": data,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
    }, 200

@admin_bp.route("/students/import", methods=["POST"])
@role_required("ADMIN")
def import_students_csv():
    if "file" not in request.files:
        raise APIError("CSV file missing", status_code=400)

    f = request.files["file"]

    stream = io.TextIOWrapper(f.stream, encoding="utf-8-sig")
    reader = csv.DictReader(stream)

    required = {"name", "email", "roll_no", "class_id"}
    headers = set(h.lower().strip() for h in reader.fieldnames or [])
    if not required.issubset(headers):
        raise APIError(
            f"CSV must contain columns: {', '.join(required)}",
            status_code=400
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
                        name=name,
                        email=email,
                        password=password,
                        role="STUDENT"
                    )
                    db.session.flush()
                    created += 1
                else:
                    updated += 1

                student = Student.query.filter_by(user_id=user.id).first()
                if not student:
                    student = Student(
                        user_id=user.id,
                        roll_no=roll_no,
                        class_id=class_id
                    )
                    db.session.add(student)
                else:
                    student.roll_no = roll_no
                    student.class_id = class_id

            except Exception as row_err:
                skipped += 1
                errors.append({
                    "row": idx,
                    "error": str(row_err)
                })
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print("IMPORT FAILED:", e)
        raise APIError("Bulk import failed", status_code=500)

    return jsonify({
        "success": True,
        "message": "Import completed",
        "created_count": created,
        "updated_count": updated,
        "skipped_count": skipped,
        "errors": errors
    }), 200

@admin_bp.route("/students/<int:student_id>", methods=["PUT"])
@role_required("ADMIN")
@validate_json({"name": None, "email": None, "password": None, "roll_no": None, "class_id": None})
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
        existing = User.query.filter(User.email == data["email"], User.id != user.id).first()
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
        query = query.filter((User.name.ilike(like)) | (User.email.ilike(like)) | (Student.roll_no.ilike(like)))

    students = query.all()

    # build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["student_id", "name", "email", "roll_no", "class_id"])
    for s in students:
        writer.writerow([s.id, s.user.name if s.user else "", s.user.email if s.user else "", s.roll_no or "", s.class_id or ""])
    output.seek(0)
    return (output.getvalue(), 200, {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=students_export.csv"
    })


# ---------- Teacher create + list (safer) ----------

@admin_bp.route("/teachers", methods=["GET"])
@role_required("ADMIN")
def list_teachers():
    users = User.query.filter_by(role="TEACHER").all()
    data = []
    for u in users:
        teacher_profile = getattr(u, "teacher_profile", None)
        data.append({
            "user_id": u.id,
            "teacher_profile_id": teacher_profile.id if teacher_profile else None,
            "name": u.name,
            "email": u.email
        })
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
    except Exception as e:
        db.session.rollback()
        print("Error creating teacher:", e)
        raise APIError("Failed to create teacher", status_code=500)

    return jsonify({"success": True, "data": {"user_id": user.id, "teacher_profile_id": teacher.id, "name": user.name, "email": user.email}}), 201


# Add this POST endpoint to assign a teacher to a class
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
        existing = TeacherClass.query.filter_by(teacher_id=teacher.id, class_id=klass.id).first()
        if existing:
            return jsonify({"success": True, "data": existing.to_dict()})

        mapping = TeacherClass(teacher_id=teacher.id, class_id=klass.id)
        db.session.add(mapping)
        db.session.commit()
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

            out.append({
                "id": m.id,
                "teacher_id": m.teacher_id,
                "teacher_name": teacher_name,
                "class_id": m.class_id,
                "class_name": klass.name if klass else None,
                "section": klass.section if klass else None,
                "year": klass.year if klass else None
            })
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
        mapping = TeacherClass.query.filter_by(teacher_id=teacher_id, class_id=class_id).first()
    else:
        raise APIError("Provide mapping id OR teacher_id and class_id", status_code=400)

    if not mapping:
        raise APIError("Mapping not found", status_code=404)

    db.session.delete(mapping)
    db.session.commit()
    return jsonify({"success": True, "message": "Mapping deleted"})



# ---------- Analytics endpoint ----------

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
        sessions_count = AttendanceSession.query.filter(AttendanceSession.session_date >= thirty).count()

        # average attendance percentage across sessions in last 30 days
        subq = db.session.query(
            AttendanceRecord.session_id.label("sid"),
            func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label("present"),
            func.count(AttendanceRecord.id).label("total")
        ).join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id).filter(AttendanceSession.session_date >= thirty).group_by(AttendanceRecord.session_id).subquery()

        rows = db.session.query(func.avg((subq.c.present * 1.0) / subq.c.total * 100)).all()
        avg_attendance = float(rows[0][0] or 0.0)

        return jsonify({"success": True, "data": {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "sessions_last_30": sessions_count,
            "avg_attendance_last_30": round(avg_attendance, 2)
        }})
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
                func.sum(case((AttendanceRecord.status == "PRESENT", 1), else_=0)).label("present"),
                func.count(AttendanceRecord.id).label("total"),
                AttendanceSession.session_date.label("session_date"),
            )
            .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
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
    """
    Pie chart derived from average attendance:
    present = avg_attendance
    absent = 100 - avg_attendance
    """
    try:
        # Reuse admin_analytics ka logic ya direct compute
        thirty = datetime.utcnow().date() - timedelta(days=30)

        subq = db.session.query(
            AttendanceRecord.session_id.label("sid"),
            func.sum(
                case((AttendanceRecord.status == "PRESENT", 1), else_=0)
            ).label("present"),
            func.count(AttendanceRecord.id).label("total"),
        ).join(
            AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id
        ).filter(
            AttendanceSession.session_date >= thirty
        ).group_by(
            AttendanceRecord.session_id
        ).subquery()

        rows = db.session.query(
            func.avg((subq.c.present * 1.0) / subq.c.total * 100)
        ).all()
        avg_attendance = float(rows[0][0] or 0.0)

        present_pct = round(avg_attendance, 1)
        absent_pct = round(max(0.0, 100.0 - present_pct), 1)

        return jsonify({
            "success": True,
            "data": {
                "present": present_pct,
                "absent": absent_pct,
                "present_count": None,
                "absent_count": None,
                "total": None,
            }
        })
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
        today_active = db.session.query(
            func.count(func.distinct(AttendanceRecord.student_id))
        ).join(
            AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id
        ).filter(
            AttendanceSession.session_date == today,
            AttendanceRecord.status == "PRESENT"
        ).scalar() or 0
        
        # 7-day trend
        trend = []
        for day_str in week_days:
            day_active = db.session.query(
                func.count(func.distinct(AttendanceRecord.student_id))
            ).join(
                AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id
            ).filter(
                AttendanceSession.session_date == day_str,
                AttendanceRecord.status == "PRESENT"
            ).scalar() or 0
            trend.append(int(day_active))
        
        return jsonify({
            "success": True,
            "data": {
                "today": int(today_active),
                "trend": trend
            }
        })
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

            out.append({
                "class_id": cls_id,
                "name": f"{name}{' ' + section if section else ''}",
                "attendance": pct,
                "student_count": int(student_count or 0),
            })


        return jsonify({"success": True, "data": out})

    except Exception as e:
        print("Class performance error:", e)
        raise APIError("Failed to compute class performance", status_code=500)


@admin_bp.route("/activity", methods=["GET"])
@role_required("ADMIN")
def admin_activity():
    # latest 3 students by id
    students = Student.query.order_by(Student.id.desc()).limit(3).all()
    # latest 2 sessions by id/date
    sessions = AttendanceSession.query.order_by(
        AttendanceSession.session_date.desc()
    ).limit(2).all()

    items = []

    for s in students:
        name = None
        if getattr(s, "user", None):
            name = s.user.name
        items.append({
            "text": f"New student registration - {name or 'Unknown'}",
            "time": "recently",
        })

    for sess in sessions:
        items.append({
            "text": f"Attendance session for class {sess.class_id}",
            "time": str(sess.session_date),
        })

    return jsonify({"success": True, "data": items[:5]})

