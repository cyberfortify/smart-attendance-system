import React, { useEffect, useState } from "react";
import api, { fetchClassMonthly } from "../../api/axios";
import ChartCard from "../../components/ChartCard";

export default function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [graph, setGraph] = useState(null); // simple class-level report placeholder
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/student/me/attendance");
        setSummary(res.data.data);
        // graphs endpoint returns class report; we use it to show a simple bar
        const g = await api.get("/student/me/graphs");
        const report = g.data.data; // { class_id, total, present, absent, percentage }
        if (report) {
          setGraph({
            labels: ["Present", "Absent"],
            data: [report.present || 0, report.absent || 0],
            title: `Overall %: ${report.percentage}%`
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="container py-8">Loading...</div>;

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">My Attendance</h2>
        {summary ? (
          <div>
            <p>Total sessions: {summary.total}</p>
            <p>Present: {summary.present}</p>
            <p>Absent: {summary.absent}</p>
            <p>Percentage: {summary.percentage}%</p>
          </div>
        ) : (
          <p>No attendance data found.</p>
        )}

        {graph && (
          <div className="mt-6">
            <ChartCard type="bar" title={graph.title} labels={graph.labels} data={graph.data} />
          </div>
        )}
      </div>
    </div>
  );
}
