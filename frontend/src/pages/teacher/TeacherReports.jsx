import React from "react";
import { Link } from "react-router-dom";

export default function TeacherReports() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Teacher Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/teacher/reports/daily" className="card">Daily Reports</Link>
        <Link to="/teacher/reports/monthly" className="card">Monthly Reports</Link>
      </div>
    </div>
  );
}
