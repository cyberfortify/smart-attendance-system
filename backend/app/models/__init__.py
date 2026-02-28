# This file ensures 'app.models' is a package and imports model classes for convenience.
from .user import User  # noqa: F401
from .classes import Class  # noqa: F401
from .student import Student  # noqa: F401
from .teacher import Teacher  # noqa: F401
from .attendance_session import AttendanceSession  # noqa: F401
from .attendance_record import AttendanceRecord  # noqa: F401
from .subject import Subject
from .teacher_subject_assignments import TeacherSubjectAssignment
from .notification import Notification
from .teacher_attendance import TeacherAttendance
from .academic_assignment import AcademicAssignment
from .assignment_submission import AssignmentSubmission