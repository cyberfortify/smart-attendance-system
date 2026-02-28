import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function StudentCalendar({ glassCard }) {
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );
    const [attendanceData, setAttendanceData] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        loadCalendar();
        loadAssignments();
    }, [selectedMonth]);

    async function loadCalendar() {
        const res = await api.get("/student/me/calendar");
        setAttendanceData(res.data.data || []);
    }

    async function loadAssignments() {
        const res = await api.get("/student/me/assignments");
        setAssignments(res.data.data || []);
    }

    const [year, month] = selectedMonth.split("-");
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    function getDateStr(day) {
        return `${selectedMonth}-${String(day).padStart(2, "0")}`;
    }

    function getAttendanceStatus(day) {
        const dateStr = getDateStr(day);
        const record = attendanceData.find(r => r.date === dateStr);
        return record?.status || null;
    }

    function getAssignmentsForDay(day) {
        const dateStr = getDateStr(day);
        return assignments.filter(a => a.due_date === dateStr);
    }

    function changeMonth(offset) {
        const date = new Date(selectedMonth + "-01");
        date.setMonth(date.getMonth() + offset);
        setSelectedMonth(date.toISOString().slice(0, 7));
    }

    return (
        <div className={`${glassCard} p-6 space-y-4`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Attendance & Assignments</h3>
                <div className="flex items-center gap-3">
                    <button onClick={() => changeMonth(-1)}>
                        <ChevronLeft size={18} />
                    </button>
                    <span className="font-medium">{selectedMonth}</span>
                    <button onClick={() => changeMonth(1)}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 text-xs text-slate-600 font-semibold">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="text-center py-1">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 min-h-[520px]">
                {cells.map((day, index) =>
                    day === null ? (
                        <div key={index} className="h-[90px]" />
                    ) : (
                        <CalendarDay
                            key={`${selectedMonth}-${day}`}
                            day={day}
                            attendance={getAttendanceStatus(day)}
                            assignments={getAssignmentsForDay(day)}
                            onClick={() => setSelectedDay({
                                day,
                                attendance: getAttendanceStatus(day),
                                assignments: getAssignmentsForDay(day)
                            })}
                        />
                    )
                )}
            </div>

            {selectedDay && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl relative">

                        <button
                            onClick={() => setSelectedDay(null)}
                            className="absolute top-3 right-3 text-slate-400"
                        >
                            ✕
                        </button>

                        <h3 className="text-lg font-semibold mb-3">
                            Details for {selectedMonth}-{String(selectedDay.day).padStart(2, "0")}
                        </h3>

                        <div className="mb-3">
                            <span className="text-sm font-medium">Attendance: </span>
                            {selectedDay.attendance || "No record"}
                        </div>

                        <div>
                            <span className="text-sm font-medium">Assignments:</span>
                            {selectedDay.assignments.length === 0 ? (
                                <div className="text-sm text-slate-500 mt-1">None</div>
                            ) : (
                                selectedDay.assignments.map(a => (
                                    <div key={a.id} className="text-sm mt-1">
                                        • {a.title}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CalendarDay({ day, attendance, assignments, onClick }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasAssignments = assignments.length > 0;

    let attendanceColor = "bg-white";

    if (attendance === "PRESENT") {
        attendanceColor = "bg-emerald-100";
    } else if (attendance === "ABSENT") {
        attendanceColor = "bg-rose-100";
    }

    return (
        <div onClick={onClick} className={`h-[90px] p-2 rounded-xl border text-xs flex flex-col ${attendanceColor}`}>
            <div className="font-semibold text-slate-700 mb-1">{day}</div>

            {hasAssignments &&
                assignments.map(a => {
                    const isOverdue = new Date(a.due_date) < today;

                    return (
                        <div
                            key={a.id}
                            className={`truncate px-2 py-1 rounded text-[9px] mb-1
                ${a.submitted
                                    ? "bg-emerald-500 text-white"
                                    : isOverdue
                                        ? "bg-rose-500 text-white"
                                        : "bg-amber-500 text-white"
                                }`}
                        >
                            {a.title}
                        </div>

                    );
                })}
        </div>
    );
}