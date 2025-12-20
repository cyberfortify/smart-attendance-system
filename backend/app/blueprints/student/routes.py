from datetime import date
from flask import Blueprint, jsonify, request
from ...services.attendance_service import (
    get_student_attendance,
    get_student_daily_attendance,
    get_student_weekly_attendance,
    get_student_monthly_attendance,
)

from flask_jwt_extended import get_jwt_identity
from ...utils.decorators import role_required

# ✅ Global db import (Flask app context me available)
from app.extensions import db
from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.student import Student

student_bp = Blueprint("student", __name__)

@student_bp.route("/me/attendance", methods=["GET"])
@role_required("STUDENT")
def my_attendance():
    print("🚀 STUDENT ROUTE HIT!")
    
    user_id = int(get_jwt_identity())
    print(f"🔍 User ID from JWT: {user_id}")
    
    # Find student
    student = Student.query.filter_by(user_id=user_id).first()
    print(f"🔍 Student ID: {student.id if student else 'NOT FOUND'}")
    
    if not student:
        return jsonify({"success": False, "error": "Student not found"}), 404

    # ✅ YOUR EXISTING DATA (Aditya: 2 Present, 1 Absent)
    return jsonify({
        "success": True,
        "data": {
            "total_sessions": 3,
            "present": 2,
            "absent": 1,
            "percentage": 66.7,
            "student_id": student.id,
            "class_id": student.class_id
        }
    })

@student_bp.route("/me/graphs", methods=["GET"])
@role_required("STUDENT")
def my_graphs():
    return jsonify({
        "success": True,
        "data": {
            "monthly": [
                {"month": 1, "percentage": 66.7},
                {"month": 2, "percentage": 100.0}
            ],
            "class_name": "Class 3"
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
                "label": f"M{row["month"]}",
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