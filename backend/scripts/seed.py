"""
Seed script: creates DB tables, admin/teacher/students and sample attendance sessions+records.

Run:
    python scripts/seed.py
"""
from datetime import date, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.classes import Class
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.attendance_session import AttendanceSession
from app.models.attendance_record import AttendanceRecord
from app.models.teacher_classes import TeacherClass

app = create_app("default")

def seed():
    with app.app_context():
        db.create_all()

        # Admin
        admin_email = "admin@example.com"
        admin = User.query.filter_by(email=admin_email).first()
        if not admin:
            admin = User(name="Admin User", email=admin_email, role="ADMIN")
            admin.set_password("admin123")
            db.session.add(admin)

        # Class
        klass = Class.query.filter_by(name="Class 8").first()
        if not klass:
            klass = Class(name="Class 8", section="A", year=2025)
            db.session.add(klass)
            db.session.flush()

        # Teacher
        teacher_email = "teacher@example.com"
        teacher_user = User.query.filter_by(email=teacher_email).first()
        if not teacher_user:
            teacher_user = User(name="Teacher One", email=teacher_email, role="TEACHER")
            teacher_user.set_password("teacher123")
            db.session.add(teacher_user)
            db.session.flush()
            teacher = Teacher(user_id=teacher_user.id, employee_id="T-1001")
            db.session.add(teacher)
        else:
            teacher = teacher_user.teacher_profile


        # Create teacher-class mapping if not exists
        tc = TeacherClass.query.filter_by(teacher_id=teacher.id, class_id=klass.id).first()
        if not tc:
            tc = TeacherClass(teacher_id=teacher.id, class_id=klass.id)
            db.session.add(tc)
            db.session.commit()
            print("Mapped teacher to class.")

        # Students
        students_data = [
            ("student1@example.com", "Student One", "R-001"),
            ("student2@example.com", "Student Two", "R-002"),
            ("student3@example.com", "Student Three", "R-003"),
        ]
        student_objs = []
        for email, name, roll in students_data:
            u = User.query.filter_by(email=email).first()
            if not u:
                u = User(name=name, email=email, role="STUDENT")
                u.set_password("student123")
                db.session.add(u)
                db.session.flush()
                s = Student(user_id=u.id, roll_no=roll, class_id=klass.id)
                db.session.add(s)
                student_objs.append(s)
            else:
                student_objs.append(u.student_profile)

        db.session.commit()

        # Create 7 days of sessions and random present/absent mix
        start = date.today() - timedelta(days=6)
        for i in range(7):
            d = start + timedelta(days=i)
            session = AttendanceSession(class_id=klass.id, teacher_id=teacher.id, session_date=d)
            db.session.add(session)
            db.session.flush()
            # alternate present/absent so reports have variation
            for idx, s in enumerate(student_objs):
                status = "PRESENT" if (i + idx) % 2 == 0 else "ABSENT"
                rec = AttendanceRecord(session_id=session.id, student_id=s.id, status=status)
                db.session.add(rec)
        db.session.commit()
        print("Seeding complete: admin/teacher/students and 7 attendance sessions created.")


if __name__ == "__main__":
    seed()
