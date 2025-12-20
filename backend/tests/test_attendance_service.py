"""
Unit tests for attendance_service functions using in-memory SQLite.
"""
from datetime import date
from app.extensions import db
from app.models.user import User
from app.models.classes import Class
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.attendance_session import AttendanceSession
from app.models.attendance_record import AttendanceRecord
from app.services.attendance_service import get_student_attendance, get_defaulters

def seed_small(app):
    # create basic objects
    klass = Class(name="Test Class", section="A", year=2025)
    db.session.add(klass)
    db.session.flush()
    # users
    tuser = User(name="T", email="t@test", role="TEACHER")
    tuser.set_password("t")
    db.session.add(tuser); db.session.flush()
    teacher = Teacher(user_id=tuser.id)
    db.session.add(teacher)
    # students
    students = []
    for i in range(3):
        u = User(name=f"S{i}", email=f"s{i}@test", role="STUDENT")
        u.set_password("s")
        db.session.add(u); db.session.flush()
        s = Student(user_id=u.id, roll_no=f"R{i}", class_id=klass.id)
        db.session.add(s)
        students.append(s)
    db.session.flush()
    # create 3 sessions and records (S0 present all, S1 absent 2, S2 present 1)
    dates = [date(2025,1,1), date(2025,1,2), date(2025,1,3)]
    for d in dates:
        sess = AttendanceSession(class_id=klass.id, teacher_id=teacher.id, session_date=d)
        db.session.add(sess); db.session.flush()
        for idx, s in enumerate(students):
            status = "PRESENT" if (idx != 1 or d == dates[2]) else "ABSENT"
            rec = AttendanceRecord(session_id=sess.id, student_id=s.id, status=status)
            db.session.add(rec)
    db.session.commit()
    return klass, students

def test_get_student_attendance(app):
    klass, students = seed_small(app)
    # student 0 should have 3 sessions and present count 3
    res = get_student_attendance(student_id=students[0].id)
    assert res["total"] == 3
    assert res["present"] == 3
    assert res["percentage"] == 100.0

def test_get_defaulters(app):
    klass, students = seed_small(app)
    # define threshold 80 -> student 1 will be defaulter
    dlist = get_defaulters(class_id=klass.id, threshold=80.0)
    ids = [d["student_id"] for d in dlist]
    assert students[1].id in ids
