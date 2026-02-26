import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import Toast from "../../components/Toast";
import {
  BookOpen,
  PlusCircle,
  Trash2,
  Layers
} from "lucide-react";

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: "", class_id: "" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const glassCard =
    "rounded-2xl bg-white/20 backdrop-blur-xl border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]";

  async function load() {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get("/admin/subjects"),
        api.get("/admin/classes"),
      ]);

      setSubjects(sRes.data.data || []);
      setClasses(cRes.data.data || []);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load subjects", variant: "error" });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createSubject() {
    if (!form.name || !form.class_id) {
      setToast({ message: "All fields required", variant: "warning" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/admin/subjects", form);
      setForm({ name: "", class_id: "" });
      setToast({ message: "Subject created successfully", variant: "success" });
      load();
    } catch (err) {
      console.error(err);
      setToast({
        message: err?.response?.data?.error || "Creation failed",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteSubject(id) {
    try {
      await api.delete(`/admin/subjects/${id}`);
      setToast({ message: "Subject deleted", variant: "success" });
      load();
    } catch (err) {
      console.error(err);
      setToast({ message: "Delete failed", variant: "error" });
    }
  }

  return (
    <div className="space-y-6 w-full">

      {/* Header */}
      <div className={`${glassCard} p-6`}>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" />
          Manage Subjects
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Create and manage subjects linked to classes
        </p>
      </div>

      {/* Create Subject */}
      <div className={`${glassCard} p-6`}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          Create Subject
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Subject Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={form.class_id}
            onChange={(e) =>
              setForm({ ...form, class_id: e.target.value })
            }
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section} ({c.year})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={createSubject}
          disabled={loading}
          className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-sm hover:opacity-90"
        >
          {loading ? "Creating..." : "Create Subject"}
        </button>
      </div>

      {/* Subject List */}
      <div className={`${glassCard} p-6`}>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          All Subjects
        </h2>

        {subjects.length === 0 ? (
          <div className="text-sm text-slate-500">
            No subjects created yet.
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((s) => {
              const klass = classes.find((c) => c.id === s.class_id);

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-white/70 rounded-xl border border-slate-200"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-600">
                      Class: {klass ? `${klass.name} ${klass.section}` : "Unknown"}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteSubject(s.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}