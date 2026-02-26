"""
Reports blueprint: class daily/monthly aggregates and defaulters endpoint.
Access: ADMIN and TEACHER
"""

from datetime import datetime
from typing import Optional
from flask import request, jsonify, Blueprint, Response, send_file
from flask_jwt_extended import get_jwt_identity
from ...utils.decorators import role_required
from ...utils.errors import APIError
from ...models.teacher import Teacher
from ...models.teacher_classes import TeacherClass
from ...models.teacher_subject_assignments import TeacherSubjectAssignment
from ...services.report_service import class_daily_counts, class_monthly_summary
import csv, io
from ...services.defaulter_service import get_class_defaulters
from ...services.student_report_service import (
    get_student_monthly_trend,
    get_student_subject_performance,
    get_student_attendance_calendar,
    get_student_summary,
    generate_student_pdf
)
from ...services.student_report_service import get_student_basic_info



reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


# ---------------- HELPERS ----------------


def _parse_date(param: Optional[str]):
    if not param:
        return None
    return datetime.strptime(param, "%Y-%m-%d").date()


def _get_teacher_user_id():
    """
    Safely extract teacher user_id from JWT identity.
    Supports int or dict identity.
    """
    identity = get_jwt_identity()

    if isinstance(identity, dict):
        return identity.get("id")
    if isinstance(identity, int):
        return identity
    return None


def _teacher_owns_class_or_raise(teacher_user_id: int, class_id: int):
    teacher = Teacher.query.filter_by(user_id=teacher_user_id).first()
    if not teacher:
        raise APIError("Teacher profile not found", status_code=404)

    assigned = TeacherSubjectAssignment.query.filter_by(
        teacher_id=teacher.id, class_id=class_id
    ).first()

    if not assigned:
        raise APIError("Forbidden: teacher not assigned to this class", status_code=403)


# ---------------- DAILY REPORT ----------------


@reports_bp.route("/class/daily", methods=["GET"])
@role_required("ADMIN", "TEACHER")
def class_daily():
    class_id = request.args.get("class_id", type=int)
    subject_id = request.args.get("subject_id", type=int)

    if not class_id:
        return jsonify({"success": False, "error": "class_id is required"}), 400

    from_str = request.args.get("from")
    to_str = request.args.get("to")

    try:
        from_date = _parse_date(from_str)
        to_date = _parse_date(to_str)
    except ValueError:
        return jsonify({"success": False, "error": "Invalid date format"}), 400

    if not from_date or not to_date:
        return jsonify({"success": False, "error": "'from' and 'to' required"}), 400

    teacher_user_id = _get_teacher_user_id()
    if teacher_user_id:
        _teacher_owns_class_or_raise(teacher_user_id, class_id)

    data = class_daily_counts(
        class_id=class_id,
        date_from=from_date.isoformat(),
        date_to=to_date.isoformat(),
        subject_id=subject_id,
    )

    return jsonify({"success": True, "data": data}), 200


# ---------------- MONTHLY REPORT ----------------
@reports_bp.route("/class/monthly", methods=["GET"])
@role_required("ADMIN", "TEACHER")
def class_monthly():
    class_id = request.args.get("class_id", type=int)
    subject_id = request.args.get("subject_id", type=int)
    year = request.args.get("year", type=int)

    if not class_id or not year:
        return jsonify({"success": False, "error": "class_id and year required"}), 400

    teacher_user_id = _get_teacher_user_id()
    if teacher_user_id:
        _teacher_owns_class_or_raise(teacher_user_id, class_id)

    data = class_monthly_summary(class_id=class_id, year=year, subject_id=subject_id)

    return jsonify({"success": True, "data": data}), 200


@reports_bp.route("/defaulters", methods=["GET"])
@role_required("TEACHER")
def defaulters_json():
    class_id = request.args.get("class_id", type=int)
    threshold = request.args.get("threshold", default=75.0, type=float)
    subject_id = request.args.get("subject_id", type=int)

    if not class_id:
        raise APIError("class_id required", 400)

    user_id = get_jwt_identity()
    _teacher_owns_class_or_raise(user_id, class_id)

    rows = get_class_defaulters(class_id, threshold, subject_id)
    return jsonify({"success": True, "data": rows}), 200


@reports_bp.route("/defaulters.csv", methods=["GET"])
@role_required("TEACHER")
def defaulters_csv():
    class_id = request.args.get("class_id", type=int)
    threshold = request.args.get("threshold", default=75.0, type=float)
    subject_id = request.args.get("subject_id", type=int)

    if not class_id:
        raise APIError("class_id required", 400)

    user_id = get_jwt_identity()
    _teacher_owns_class_or_raise(user_id, class_id)

    rows = get_class_defaulters(class_id, threshold, subject_id)

    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(["roll", "name", "presents", "total_sessions", "percent"])

    for r in rows:
        cw.writerow(
            [r["roll"], r["name"], r["presents"], r["total_sessions"], r["percent"]]
        )

    output = si.getvalue()
    resp = Response(output, mimetype="text/csv")
    resp.headers["Content-Disposition"] = (
        f"attachment; filename=defaulters_class_{class_id}.csv"
    )
    return resp




@reports_bp.route("/student/<int:student_id>/pdf", methods=["GET"])
@role_required("TEACHER")
def student_pdf(student_id):
    pdf = generate_student_pdf(student_id)
    return send_file(
        pdf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"student_{student_id}_report.pdf"
    )


@reports_bp.route("/student/<int:student_id>", methods=["GET"])
@role_required("TEACHER")
def student_profile(student_id):

    basic = get_student_basic_info(student_id)
    summary = get_student_summary(student_id)
    monthly = get_student_monthly_trend(student_id)
    subjects = get_student_subject_performance(student_id)
    calendar = get_student_attendance_calendar(student_id)

    return jsonify({
        "success": True,
        "data": {
            "basic_info": basic,
            "summary": summary,
            "monthly_trend": monthly,
            "subject_performance": subjects,
            "calendar": calendar
        }
    }), 200