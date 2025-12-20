import React, { useEffect, useState } from "react";
import { fetchClassDaily } from "../../api/axios";
import ChartCard from "../../components/ChartCard";

export default function TeacherReportsDaily() {
  const [classId, setClassId] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);

  async function load() {
    if (!classId || !from || !to) return;
    try {
      const rows = await fetchClassDaily(classId, from, to);
      setData(rows);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    // optional default last 7 days
    const t = new Date();
    const f = new Date(); f.setDate(t.getDate() - 6);
    setTo(t.toISOString().slice(0,10));
    setFrom(f.toISOString().slice(0,10));
  }, []);

  useEffect(() => { load(); }, [classId, from, to]);

  const labels = (data || []).map(d => d.date);
  const values = (data || []).map(d => d.present);

  return (
    <div className="container py-8">
      <h2 className="text-xl font-semibold mb-4">Daily Attendance</h2>

      <div className="mb-4 flex gap-2 items-center">
        <label>Class ID</label>
        <input value={classId} onChange={e => setClassId(Number(e.target.value))} className="p-2 border rounded w-24" />
        <label>From</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="p-2 border rounded" />
        <label>To</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="p-2 border rounded" />
        <button onClick={load} className="px-3 py-1 bg-blue-600 text-white rounded">Load</button>
      </div>

      {data ? <ChartCard type="line" title="Present per day" labels={labels} data={values} /> : <p>No data</p>}
    </div>
  );
}
