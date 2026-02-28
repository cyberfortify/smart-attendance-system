from datetime import date, datetime
from flask import Blueprint, jsonify, request
from ...services.attendance_service import get_student_attendance
from ...services.attendance_service import get_student_daily_attendance
from ...services.attendance_service import get_student_weekly_attendance
from ...services.attendance_service import get_student_monthly_attendance
from ...models.notification import Notification
from datetime import datetime
from flask_jwt_extended import get_jwt_identity
from ...utils.decorators import role_required

# Global db import (Flask app context me available)
from app.extensions import db
from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.student import Student

from ...models.academic_assignment import AcademicAssignment
from ...models.assignment_submission import AssignmentSubmission
import os
import uuid

student_bp = Blueprint("student", __name__)

@student_bp.route("/notifications", methods=["GET"])
@role_required("STUDENT")
def get_student_notifications():
    try:
        user_id = int(get_jwt_identity())

        notifications = (
            Notification.query
            .filter_by(user_id=user_id)
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
                "is_read": n.is_read,
                "type": n.type,
            }
            for n in notifications
        ]

        return jsonify({"success": True, "data": data})

    except Exception as e:
        print("Student notification error:", e)
        return jsonify({"success": False, "error": "Failed to load notifications"}), 500


@student_bp.route("/notifications/read", methods=["PATCH"])
@role_required("STUDENT")
def mark_student_notifications_read():
    try:
        user_id = int(get_jwt_identity())
        print("JWT USER ID:", user_id)

        notifications = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).all()

        print("FOUND UNREAD:", len(notifications))

        for n in notifications:
            n.is_read = True

        db.session.commit()

        print("UPDATED SUCCESSFULLY")

        return jsonify({"success": True})

    except Exception as e:
        db.session.rollback()
        print("Student mark read error:", e)
        return jsonify({"success": False, "error": "Failed to update"}), 500
    
    

@student_bp.route("/me/attendance", methods=["GET"])
@role_required("STUDENT")
def my_attendance():
    print(" STUDENT ROUTE HIT!")
    
    user_id = int(get_jwt_identity())
    print(f" User ID from JWT: {user_id}")
    
    # Find student
    student = Student.query.filter_by(user_id=user_id).first()
    print(f"Student ID: {student.id if student else 'NOT FOUND'}")
    
    if not student:
        return jsonify({"success": False, "error": "Student not found"}), 404

    summary = get_student_attendance(student.id)

    return jsonify({
        "success": True,
        "data": summary
    })

@student_bp.route("/me/graphs", methods=["GET"])
@role_required("STUDENT")
def my_graphs():
    user_id = int(get_jwt_identity())
    student = Student.query.filter_by(user_id=user_id).first()
    if not student:
        return jsonify({"success": False, "error": "Student not found"}), 404

    year = date.today().year
    monthly = get_student_monthly_attendance(student.id, year)

    return jsonify({
        "success": True,
        "data": {
            "monthly": monthly,
            "class_name": f"Class {student.class_id}"
        }
    })


@student_bp.route("/me/analytics", methods=["GET"])
@role_required("STUDENT")
def my_analytics():
    """
    ?range=day|week|month|year
    """
    user_id = int(get_jwt_identity())
    student = Student.query.filter_by(user_id=user_id).first()
    if not student:
        return jsonify({"success": False, "error": "Student profile not found"}), 404

    range_type = request.args.get("range", "month")

    summary = get_student_attendance(student.id)

    if range_type == "day":
        series = get_student_daily_attendance(student.id, days=7)
    elif range_type == "week":
        series = get_student_weekly_attendance(student.id, weeks=8)
    elif range_type == "year":
        # tumhara existing helper ko year de do
        year = date.today().year
        monthly = get_student_monthly_attendance(student.id, year=year)
        series = [
            {
                "label": f"M{row['month']}",
                "present": row["present"],
                "absent": row["total"] - row["present"],
                "percentage": row["percentage"],
            }
            for row in monthly
        ]
    else:  # month (last 30 days)
        series = get_student_daily_attendance(student.id, days=30)

    return jsonify({
        "success": True,
        "data": {
            "summary": summary,
            "series": series,
        }
    })

@student_bp.route("/me/calendar", methods=["GET"])
@role_required("STUDENT")
def my_calendar():
    """
    Returns last 90 days attendance
    [
        { "date": "2026-02-20", "status": "PRESENT" }
    ]
    """
    try:
        user_id = int(get_jwt_identity())
        student = Student.query.filter_by(user_id=user_id).first()

        if not student:
            return jsonify({"success": False, "error": "Student not found"}), 404

        from datetime import timedelta
        today = date.today()
        start_date = today - timedelta(days=90)

        records = (
            AttendanceRecord.query
            .join(AttendanceSession)
            .filter(
                AttendanceRecord.student_id == student.id,
                AttendanceSession.session_date >= start_date
            )
            .order_by(AttendanceSession.session_date.asc())
            .all()
        )

        data = []
        for record in records:
            data.append({
                "date": record.session.session_date.strftime("%Y-%m-%d"),
                "status": record.status
            })

        return jsonify({
            "success": True,
            "data": data
        })

    except Exception as e:
        print("Calendar error:", e)
        return jsonify({"success": False, "error": "Failed to load calendar"}), 500
    

@student_bp.route("/me/assignments", methods=["GET"])
@role_required("STUDENT")
def student_assignments():

    user_id = int(get_jwt_identity())
    student = Student.query.filter_by(user_id=user_id).first()

    if not student:
        return jsonify({"success": False, "error": "Student not found"}), 404

    assignments = AcademicAssignment.query.filter_by(
        class_id=student.class_id
    ).order_by(AcademicAssignment.due_date.asc()).all()

    data = []

    for a in assignments:
        submission = AssignmentSubmission.query.filter_by(
            assignment_id=a.id,
            student_id=student.id
        ).first()

        data.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date.strftime("%Y-%m-%d"),
            "subject_name": a.subject.name if a.subject else None,
            "file_path": a.file_path,
            "submitted": bool(submission),
            "submitted_at": submission.submitted_at.strftime("%Y-%m-%d")
            if submission else None
        })

    return jsonify({"success": True, "data": data})


@student_bp.route("/me/assignments/<int:assignment_id>/submit", methods=["POST"])
@role_required("STUDENT")
def submit_assignment(assignment_id):

    user_id = int(get_jwt_identity())
    student = Student.query.filter_by(user_id=user_id).first()

    if not student:
        return jsonify({"success": False}), 404

    assignment = AcademicAssignment.query.get_or_404(assignment_id)

    if "file" not in request.files:
        return jsonify({"success": False, "error": "File required"}), 400

    file = request.files["file"]

    upload_folder = "uploads/submissions"
    os.makedirs(upload_folder, exist_ok=True)

    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    existing = AssignmentSubmission.query.filter_by(
        assignment_id=assignment_id,
        student_id=student.id
    ).first()

    if existing:
        existing.file_path = file_path
        existing.submitted_at = datetime.utcnow()
    else:
        new_sub = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student.id,
            file_path=file_path,
            submitted_at=datetime.utcnow()
        )
        db.session.add(new_sub)

    db.session.commit()

    return jsonify({"success": True})
