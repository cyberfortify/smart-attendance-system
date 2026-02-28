import React, { useEffect, useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { X, Trash2, Pencil, GripVertical } from "lucide-react";
import api from "../../api/axios";

export default function TeacherAssignmentCalendar({ glassCard }) {
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [viewMode, setViewMode] = useState("month");

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        loadAssignments();
    }, [selectedMonth, selectedClass]);

    async function loadClasses() {
        const res = await api.get("/teacher/classes");
        setClasses(res.data.data || []);
    }

    async function loadAssignments() {
        const res = await api.get("/teacher/assignment-calendar", {
            params: {
                month: selectedMonth,
                class_id: selectedClass || undefined
            }
        });
        setAssignments(res.data.data || []);
    }

    async function handleDragEnd(event) {
        const { active, over } = event;
        if (!over) return;

        await api.put(`/teacher/academic-assignments/${active.id}`, {
            due_date: over.id
        });

        loadAssignments();
    }

    const [year, month] = selectedMonth.split("-");
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const calendarCells = [];

    // empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarCells.push(null);
    }

    // actual days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarCells.push(i);
    }

    function getAssignmentsForDay(day) {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
        return assignments.filter(a => a.due_date === dateStr);
    }
    function getCurrentWeekDates() {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }

    return (
        <div className={`${glassCard} p-6 space-y-6`}>

            {/* HEADER */}
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-2xl font-bold">Assignment Planner</h2>

                <div className="flex gap-3">

                    <button
                        onClick={() => setViewMode(viewMode === "month" ? "week" : "month")}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                    >
                        {viewMode === "month" ? "Week View" : "Month View"}
                    </button>
                    {/* Multi Class Filter */}
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 border rounded-xl bg-white shadow-sm"
                    >
                        <option value="">All Classes</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.section && `- ${c.section}`}
                            </option>
                        ))}
                    </select>



                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border rounded-xl bg-white shadow-sm"
                    />
                </div>
            </div>

            {/* WEEK HEADERS */}
            <div className="grid grid-cols-7 text-xs font-semibold text-slate-600">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="text-center py-2">{d}</div>
                ))}
            </div>

            <DndContext onDragEnd={handleDragEnd}>
                {viewMode === "month" ? (

                    <div className="grid grid-cols-7 gap-2">
                        {calendarCells.map((day, index) =>
                            day === null ? (
                                <div key={`empty-${index}`} className="h-[110px]" />
                            ) : (
                                <CalendarDay
                                    key={`${selectedMonth}-${day}`}
                                    day={day}
                                    month={selectedMonth}
                                    assignments={getAssignmentsForDay(day)}
                                    onSelect={setSelectedAssignment}
                                />
                            )
                        )}
                    </div>

                ) : (

                    <div className="grid grid-cols-7 gap-2">
                        {getCurrentWeekDates().map(date => {
                            const dateStr = date.toISOString().slice(0, 10);

                            return (
                                <CalendarDay
                                    key={dateStr}
                                    day={date.getDate()}
                                    month={selectedMonth}
                                    assignments={assignments.filter(a => a.due_date === dateStr)}
                                    onSelect={setSelectedAssignment}
                                />
                            );
                        })}
                    </div>

                )}
            </DndContext>

            {selectedAssignment && (
                <AssignmentModal
                    assignment={selectedAssignment}
                    onClose={() => setSelectedAssignment(null)}
                    onRefresh={loadAssignments}
                />
            )}
        </div>
    );
}

function CalendarDay({ day, month, assignments, onSelect }) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const { setNodeRef } = useDroppable({ id: dateStr });

    return (
        <div
            ref={setNodeRef}
            className="h-[110px] bg-white/80 rounded-xl border border-slate-200 p-2 flex flex-col"
        >
            <div className="text-[11px] font-bold text-slate-700 mb-1">
                {day}
            </div>

            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 relative">
                {assignments.map(a => (
                    <DraggableAssignment
                        key={a.id}
                        assignment={a}
                        onClick={() => onSelect(a)}
                    />
                ))}
            </div>
        </div>
    );
}

function DraggableAssignment({ assignment, onClick }) {

    const { attributes, listeners, setNodeRef, transform } =
        useDraggable({ id: assignment.id });

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : undefined;

    const today = new Date();
    const dueDate = new Date(assignment.due_date);

    // Remove time difference issue
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    let bgColor = "bg-emerald-500"; // upcoming default

    if (dueDate < today) {
        bgColor = "bg-rose-500"; // overdue
    }
    else if (dueDate.getTime() === today.getTime()) {
        bgColor = "bg-yellow-500"; // due today
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${bgColor} text-white text-[10px] rounded-lg px-2 py-1 cursor-pointer flex items-center justify-between transition`}
            onClick={onClick}
        >
            <span className="truncate">{assignment.title}</span>

            <div
                {...listeners}
                {...attributes}
                className="cursor-grab"
            >
                <GripVertical size={12} />
            </div>
        </div>
    );
}

function AssignmentModal({ assignment, onClose, onRefresh }) {

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        title: assignment.title,
        description: assignment.description || "",
        due_date: assignment.due_date
    });

    const submissionRate =
        assignment.total_students > 0
            ? Math.round((assignment.submitted_count * 100) / assignment.total_students)
            : 0;

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSave() {
        await api.put(`/teacher/academic-assignments/${assignment.id}`, form);
        onRefresh();
        setIsEditing(false);
    }

    async function handleDelete() {
        await api.delete(`/teacher/academic-assignments/${assignment.id}`);
        onRefresh();
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[420px] p-6 shadow-xl relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-black"
                >
                    <X />
                </button>

                {isEditing ? (
                    <>
                        <h3 className="text-lg font-bold mb-4">Edit Assignment</h3>

                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            className="w-full mb-3 px-3 py-2 border rounded-lg text-sm"
                        />

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className="w-full mb-3 px-3 py-2 border rounded-lg text-sm"
                        />

                        <input
                            type="date"
                            name="due_date"
                            value={form.due_date}
                            onChange={handleChange}
                            className="w-full mb-4 px-3 py-2 border rounded-lg text-sm"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                            >
                                Save
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-bold mb-3">{assignment.title}</h3>

                        <div className="text-sm text-slate-600 space-y-1 mb-4">
                            <div>Class: {assignment.class_name} - {assignment.section}</div>
                            <div>Subject: {assignment.subject_name}</div>
                            <div>Due: {assignment.due_date}</div>
                        </div>

                        <div className="mb-4">
                            <div className="text-xs mb-1">Submission Progress</div>
                            <div className="w-full bg-slate-200 h-2 rounded-full">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full"
                                    style={{ width: `${submissionRate}%` }}
                                />
                            </div>
                            <div className="text-xs mt-1">
                                {assignment.submitted_count}/{assignment.total_students} submitted
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 mt-6">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                            >
                                <Pencil size={14} />
                                Edit
                            </button>

                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}