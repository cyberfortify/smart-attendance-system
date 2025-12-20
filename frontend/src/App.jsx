import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import ManageClasses from "./pages/admin/ManageClasses";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TakeAttendance from "./pages/teacher/TakeAttendanceSection";
import TeacherReports from "./pages/teacher/TeacherReports";
import TeacherReportsDaily from "./pages/teacher/TeacherReportsDaily";
import TeacherReportsMonthly from "./pages/teacher/TeacherReportsMonthly";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import { getUser } from "./utils/auth";

function ProtectedRoute({ children, roles }) {
  const user = getUser();

  if (!user || !user.role) return <Navigate to="/login" replace />;

  const userRole = String(user.role).toUpperCase(); // normalize

  if (roles && !roles.map(r => r.toUpperCase()).includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <ManageClasses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <ManageStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <ManageTeachers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/take-attendance"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <TakeAttendance />
          </ProtectedRoute>
        }
      />
      <Route path="/teacher/reports" element={<ProtectedRoute roles={["TEACHER"]}><TeacherReports /></ProtectedRoute>} />
      <Route path="/teacher/reports/daily" element={<ProtectedRoute roles={["TEACHER"]}><TeacherReportsDaily /></ProtectedRoute>} />
      <Route path="/teacher/reports/monthly" element={<ProtectedRoute roles={["TEACHER"]}><TeacherReportsMonthly /></ProtectedRoute>} />

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <StudentAttendance />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
