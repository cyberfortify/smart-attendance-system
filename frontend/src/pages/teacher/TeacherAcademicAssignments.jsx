import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { CalendarDays, PlusCircle } from "lucide-react";

export default function TeacherAcademicAssignments({ glassCard }) {
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [academicAssignments, setAcademicAssignments] = useState([]);
  const [form, setForm] = useState({
    class_id: "",
    subject_id: "",
    title: "",
    description: "",
    due_date: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeachingAssignments();
    loadAcademicAssignments();
  }, []);

  async function loadTeachingAssignments() {
    const res = await api.get("/teacher/assignments");
    setTeachingAssignments(res.data.data || []);
  }

  async function loadAcademicAssignments() {
    const res = await api.get("/teacher/academic-assignments");
    setAcademicAssignments(res.data.data || []);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/teacher/academic-assignments", form);
      setForm({
        class_id: "",
        subject_id: "",
        title: "",
        description: "",
        due_date: "",
      });
      loadAcademicAssignments();
    } catch (err) {
      alert("Failed to create assignment");
    }

    setLoading(false);
  }

  const today = new Date();

  return (
    <div className="space-y-6">

      {/* CREATE FORM */}
      <div className={`${glassCard} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Create Assignment
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Class */}
          <select
            name="class_id"
            value={form.class_id}
            onChange={handleChange}
            required
            className="px-4 py-2 border rounded-xl bg-white/70 text-sm"
          >
            <option value="">Select Class</option>
            {[...new Map(teachingAssignments.map(a => [a.class_id, a])).values()]
              .map(c => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name} {c.section ? `- ${c.section}` : ""}
                </option>
              ))}
          </select>

          {/* Subject */}
          <select
            name="subject_id"
            value={form.subject_id}
            onChange={handleChange}
            required
            className="px-4 py-2 border rounded-xl bg-white/70 text-sm"
          >
            <option value="">Select Subject</option>
            {teachingAssignments
              .filter(a => a.class_id === Number(form.class_id))
              .map(s => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_name}
                </option>
              ))}
          </select>

          {/* Title */}
          <input
            type="text"
            name="title"
            placeholder="Assignment Title"
            value={form.title}
            onChange={handleChange}
            required
            className="px-4 py-2 border rounded-xl bg-white/70 text-sm col-span-1 md:col-span-2"
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder="Assignment Description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className="px-4 py-2 border rounded-xl bg-white/70 text-sm col-span-1 md:col-span-2"
          />

          {/* Due Date */}
          <div className="flex items-center gap-2 col-span-1 md:col-span-2">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
              required
              className="px-4 py-2 border rounded-xl bg-white/70 text-sm w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="col-span-1 md:col-span-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
          >
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </form>
      </div>

      {/* ASSIGNMENT LIST */}
      <div className={`${glassCard} p-6`}>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Your Assignments
        </h3>

        {academicAssignments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No assignments created yet.
          </p>
        ) : (
          <div className="space-y-3">
            {academicAssignments.map(a => {
              const due = new Date(a.due_date);
              const isOverdue = due < today;

              return (
                <div
                  key={a.id}
                  className="p-4 rounded-xl bg-white/70 border border-slate-200 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {a.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      Due: {a.due_date}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isOverdue
                        ? "bg-rose-100 text-rose-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {isOverdue ? "Overdue" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}