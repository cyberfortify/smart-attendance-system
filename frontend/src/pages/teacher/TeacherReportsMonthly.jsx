import React, { useEffect, useState } from "react";
import { fetchClassMonthly } from "../../api/axios";
import ChartCard from "../../components/ChartCard";

export default function TeacherReportsMonthly() {
  const [classId, setClassId] = useState(1);
  const [year, setYear] = useState(2025);
  const [data, setData] = useState(null);

  async function load() {
    try {
      const rows = await fetchClassMonthly(classId, year);
      setData(rows);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { load(); }, [classId, year]);

  const labels = (data || []).map(d => `M-${d.month}`);
  const values = (data || []).map(d => d.present);

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold mb-4">Monthly Attendance</h2>

      <div className="mb-4 flex gap-2 items-center">
        <label>Class ID</label>
        <input value={classId} onChange={e => setClassId(Number(e.target.value))} className="p-2 border rounded w-24" />
        <label>Year</label>
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="p-2 border rounded w-24" />
        <button onClick={load} className="px-3 py-1 bg-blue-600 text-white rounded">Load</button>
      </div>

      {data ? <ChartCard type="bar" title="Present per month" labels={labels} data={values} /> : <p>No data</p>}
    </div>
  );
}
