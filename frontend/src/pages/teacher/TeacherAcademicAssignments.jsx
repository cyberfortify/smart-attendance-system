import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  CalendarDays,
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  Paperclip,
  X
} from "lucide-react";

export default function TeacherAcademicAssignments({ glassCard }) {

  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [academicAssignments, setAcademicAssignments] = useState([]);

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [form, setForm] = useState({
    class_id: "",
    subject_id: "",
    title: "",
    description: "",
    due_date: "",
    file: null
  });

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
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key]) formData.append(key, form[key]);
    });

    await api.post("/teacher/academic-assignments", formData);

    setForm({ title: "", description: "", due_date: "", file: null });
    loadAcademicAssignments();
  }

  async function saveEdit() {
    await api.put(`/teacher/academic-assignments/${editing.id}`, editing);
    setEditing(null);
    loadAcademicAssignments();
  }

  async function confirmDelete() {
    await api.delete(`/teacher/academic-assignments/${deleting.id}`);
    setDeleting(null);
    loadAcademicAssignments();
  }

  async function viewSubmissions(a) {
    const res = await api.get(`/teacher/academic-assignments/${a.id}/submissions`);
    setSubmissions(res.data.data || []);
    setViewing(a);
  }

  const today = new Date();


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* 🔵 LEFT SIDE — ASSIGNMENT LIST (BIG) */}
      <div className={`lg:col-span-2 ${glassCard} p-6`}>
        <h3 className="text-lg font-semibold mb-5">
          Your Assignments
        </h3>

        {academicAssignments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No assignments created yet.
          </p>
        ) : (
          academicAssignments.map(a => {
            const isOverdue = new Date(a.due_date) < new Date();

            return (
              <div
                key={a.id}
                className="p-4 border rounded-xl flex justify-between items-center mb-3 bg-white/70 hover:bg-white transition"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {a.title}
                  </div>

                  <div className="text-xs text-slate-500 mt-1 space-y-1">
                    <div>
                      📚 Class: {a.class_name} {a.section ? `- ${a.section}` : ""}
                    </div>
                    <div>
                      📖 Subject: {a.subject_name}
                    </div>
                    <div>
                      🗓 Due: {a.due_date}
                    </div>
                  </div>

                  {a.file_path && (
                    <div className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Attachment Available
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">

                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isOverdue
                    ? "bg-rose-100 text-rose-600"
                    : "bg-emerald-100 text-emerald-600"
                    }`}>
                    {isOverdue ? "Overdue" : "Upcoming"}
                  </span>

                  <Eye
                    className="w-4 h-4 cursor-pointer text-slate-600 hover:text-indigo-600"
                    onClick={() => viewSubmissions(a)}
                  />

                  <Pencil
                    className="w-4 h-4 cursor-pointer text-indigo-600 hover:scale-110 transition"
                    onClick={() => setEditing(a)}
                  />

                  <Trash2
                    className="w-4 h-4 cursor-pointer text-rose-500 hover:scale-110 transition"
                    onClick={() => setDeleting(a)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🟣 RIGHT SIDE — CREATE CARD (SMALLER) */}
      <div className={`${glassCard} p-5 lg:col-span-1 h-fit`}>
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-semibold">
            Create Assignment
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Assignment Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>

          {/* Class */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Class
            </label>
            <select
              name="class_id"
              value={form.class_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            >
              <option value="">Select Class</option>
              {[...new Map(teachingAssignments.map(a => [a.class_id, a])).values()]
                .map(c => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name} {c.section ? `- ${c.section}` : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Subject
            </label>
            <select
              name="subject_id"
              value={form.subject_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
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
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Attachment (Optional)
            </label>

            <label className="flex items-center justify-center gap-2 text-sm cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg border border-dashed border-slate-300">
              <Paperclip className="w-4 h-4" />
              {form.file ? form.file.name : "Upload File"}
              <input
                type="file"
                name="file"
                hidden
                onChange={handleChange}
              />
            </label>
          </div>

          <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition">
            Create Assignment
          </button>

        </form>
      </div>



      {/* VIEW SUBMISSIONS MODAL */}
      {
        viewing && (
          <Modal onClose={() => setViewing(null)} title="Student Submissions">
            {submissions.length === 0 ? (
              <p className="text-sm text-slate-500">No submissions yet.</p>
            ) : (
              submissions.map((s, i) => (
                <div key={i}
                  className="flex justify-between items-center p-2 border rounded-lg mb-2">
                  <span className="text-sm">Student ID: {s.student_id}</span>
                  <a href={`/${s.file_path}`}
                    target="_blank"
                    className="text-indigo-600 text-sm underline">
                    Download
                  </a>
                </div>
              ))
            )}
          </Modal>
        )
      }

      {/* EDIT MODAL */}
      {
        editing && (
          <Modal onClose={() => setEditing(null)} title="Edit Assignment">
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
            />
            <textarea
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
            />
            <input
              type="date"
              value={editing.due_date}
              onChange={(e) => setEditing({ ...editing, due_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
                Save
              </button>
            </div>
          </Modal>
        )
      }

      {/* DELETE MODAL */}
      {
        deleting && (
          <Modal onClose={() => setDeleting(null)} title="Confirm Delete">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this assignment?
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg text-sm">
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm">
                Delete
              </button>
            </div>
          </Modal>
        )
      }

    </div>
  );
}


/* 🔥 Reusable Modal Component */
function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[400px] p-5 relative animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-sm">{title}</h3>
          <X className="w-4 h-4 cursor-pointer" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}
