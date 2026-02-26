import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ChartCard from "../../components/ChartCard";

export default function StudentProfilePage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/reports/student/${studentId}`);
        setData(res.data?.data || null);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId]);

  const monthlyLabels = (data?.monthly_trend || []).map(d => `M-${d.month}`);
  const monthlyValues = (data?.monthly_trend || []).map(d => d.percent);

  const subjectLabels = (data?.subject_performance || []).map(d => d.subject);
  const subjectValues = (data?.subject_performance || []).map(d => d.percent);

  const subjectOptions = Array.from(
    new Map(
      (data?.calendar || []).map(d => [
        d.subject_id,
        d.subject_name
      ])
    )
  ).map(([id, name]) => ({
    id,
    name
  }));

  // 1️ Subject filter
  const subjectFiltered = (data?.calendar || []).filter(d =>
    selectedSubject === "" ? true : d.subject_id === selectedSubject
  );

  // 2️ Available Years (full data se)
  const availableYears = [
    ...new Set(
      (data?.calendar || []).map(d =>
        new Date(d.date).getFullYear()
      )
    )
  ];

  // Auto select latest year
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(Math.max(...availableYears));
    }
  }, [availableYears, selectedYear]);

  // 3️ Year filter
  const yearFiltered = subjectFiltered.filter(d =>
    selectedYear
      ? new Date(d.date).getFullYear() === selectedYear
      : true
  );

  // 4️ Month filter
  const finalFiltered = yearFiltered.filter(d =>
    selectedMonth === ""
      ? true
      : new Date(d.date).getMonth() === selectedMonth
  );

  //  SAFE RETURNS HERE (after all hooks)
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!data || !data.summary) {
    return <div className="p-6">No data found</div>;
  }

  const summary = data.summary;
  const basic = data.basic_info;

  // Mini Sparkline Data (last 6 months)
  const sparklineLabels = monthlyLabels.slice(-6);
  const sparklineValues = monthlyValues.slice(-6);

  // Performance Level
  const performanceLevel =
    summary.percent >= 85
      ? "Excellent"
      : summary.percent >= 75
        ? "Good"
        : summary.percent >= 60
          ? "Average"
          : "Poor";

  // Consistency Score (based on monthly variance)
  let consistencyScore = 0;
  if (monthlyValues.length > 1) {
    const avg =
      monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;

    const variance =
      monthlyValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      monthlyValues.length;

    const stdDev = Math.sqrt(variance);

    // Lower std dev = higher consistency
    consistencyScore = Math.max(
      0,
      Math.round(100 - stdDev)
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <h2 className="text-xl font-bold">{basic?.name}</h2>
          <div className="text-xs text-slate-500">
            Roll No: {basic?.roll}
          </div>
        </div>

        {/* Mini Sparkline */}
        <div className="w-40">
          <ChartCard
            type="line"
            labels={sparklineLabels}
            data={sparklineValues}
            height={80}
          />
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${summary.risk === "Critical"
            ? "bg-red-100 text-red-600"
            : summary.risk === "At Risk"
              ? "bg-amber-100 text-amber-600"
              : "bg-green-100 text-green-600"
            }`}
        >
          {summary.risk}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Attendance */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
          <div className="text-xs text-slate-500">Attendance</div>
          <div className="text-2xl font-bold">{summary.percent}%</div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className={`h-2 rounded-full ${summary.percent >= 75 ? "bg-green-500" : "bg-amber-500"
                }`}
              style={{ width: `${summary.percent}%` }}
            />
          </div>

          <div className="text-xs text-slate-500">
            {performanceLevel}
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-500">Total Sessions</div>
          <div className="text-2xl font-bold">
            {summary.total_sessions}
          </div>
        </div>

        {/* Consistency Score */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="text-xs text-slate-500">
            Consistency Score
          </div>
          <div className="text-2xl font-bold">
            {consistencyScore}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Stability of monthly performance
          </div>
        </div>

      </div>

      {/* Charts Row (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold mb-3">
            Subject Performance
          </h3>
          <ChartCard
            type="bar"
            labels={subjectLabels}
            data={subjectValues}
            height={240}
          />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold mb-3">
            Monthly Trend
          </h3>
          <ChartCard
            type="line"
            labels={monthlyLabels}
            data={monthlyValues}
            height={240}
          />
        </div>

      </div>

      {/* Compact Calendar */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h3 className="text-sm font-semibold">
            Attendance Calendar
          </h3>

          <div className="flex gap-2">

            <select
              value={selectedSubject}
              onChange={(e) =>
                setSelectedSubject(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="">All Subjects</option>
              {subjectOptions.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index} value={index}>
                  {new Date(0, index).toLocaleString("default", { month: "short" })}
                </option>
              ))}
            </select>

            <select
              value={selectedYear || ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 border rounded text-xs"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

          </div>
        </div>

        {selectedYear && selectedMonth !== "" && (
          <div className="rounded-xl p-4 bg-white shadow-sm">

            {/* Days Header */}
            <div className="grid grid-cols-7 text-xs text-slate-500 mb-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-sm">

              {(() => {
                const firstDay = new Date(
                  selectedYear,
                  selectedMonth,
                  1
                ).getDay();

                const daysInMonth = new Date(
                  selectedYear,
                  selectedMonth + 1,
                  0
                ).getDate();

                const cells = [];

                // Empty cells before month starts
                for (let i = 0; i < firstDay; i++) {
                  cells.push(
                    <div key={`empty-${i}`} />
                  );
                }

                // Actual days
                for (let day = 1; day <= daysInMonth; day++) {

                  const dateStr = `${selectedYear}-${String(
                    selectedMonth + 1
                  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  const record = finalFiltered.find(
                    r => r.date === dateStr
                  );

                  let bg = "bg-gray-100 text-slate-400";

                  if (record?.status === "PRESENT")
                    bg = "bg-green-500 text-white";

                  if (record?.status === "ABSENT")
                    bg = "bg-red-500 text-white";

                  cells.push(
                    <div
                      key={dateStr}
                      className={`h-10 flex items-center justify-center rounded-md font-medium transition ${bg}`}
                      title={
                        record
                          ? `${dateStr} - ${record.status}`
                          : dateStr
                      }
                    >
                      {day}
                    </div>
                  );
                }

                return cells;
              })()}

            </div>
          </div>
        )}

      </div>

    </div>
  );
}