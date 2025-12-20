import React, { useEffect, useState } from "react";

const STATUSES = ["PRESENT", "ABSENT"];

export default function AttendanceTable({ students, values, setValue }) {
  const [activeStudent, setActiveStudent] = useState(null);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (!activeStudent) return;

      if (e.key.toLowerCase() === "p") setValue(activeStudent, "PRESENT");
      if (e.key.toLowerCase() === "a") setValue(activeStudent, "ABSENT");
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeStudent, setValue]);

  const total = students.length || 1;
  const presentCount = Object.values(values).filter(v => v === "PRESENT").length;
  const presentPercent = Math.round((presentCount / total) * 100);

  function markAll(status) {
    students.forEach(s => setValue(s.id, status));
  }

  const badge = {
    PRESENT: "bg-emerald-600 text-white",
    ABSENT: "bg-rose-600 text-white",
  };

  const soft = {
    PRESENT: "bg-emerald-100 text-emerald-700",
    ABSENT: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => markAll("PRESENT")}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll("ABSENT")}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs sm:text-sm"
          >
            Mark All Absent
          </button>
        </div>

        {/* Progress */}
        <div className="w-full sm:w-48">
          <div className="text-xs mb-1 text-slate-600">
            Present: {presentPercent}%
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${presentPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="
        rounded-xl border bg-white
        max-h-[70vh] sm:max-h-[70vh] 
        overflow-x-auto overflow-y-auto
      "
      >
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-2 sm:px-4 py-2 text-left whitespace-nowrap">Roll</th>
              <th className="px-2 sm:px-4 py-2 text-left">Name</th>
              <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap">
                Attendance
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const status = values[s.id];
              return (
                <tr
                  key={s.id}
                  onClick={() => setActiveStudent(s.id)}
                  className={`border-t cursor-pointer ${activeStudent === s.id ? "ring-2 ring-indigo-300" : ""
                    }`}
                >
                  <td className="px-2 sm:px-4 py-2 align-middle whitespace-nowrap">
                    {s.roll_number}
                  </td>
                  <td className="px-2 sm:px-4 py-2 align-middle">
                    <div className="font-medium text-slate-900 truncate max-w-[120px] sm:max-w-none">
                      {s.name}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-center align-middle">
                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                      {STATUSES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue(s.id, st);
                          }}
                          className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs transition ${status === st ? badge[st] : soft[st]
                            }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
