import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ConfirmModal from "../../components/ConfirmModal";
import Toast from "../../components/Toast";
import {
  Search,
  Download,
  PlusCircle,
  Edit2,
  Trash2,
  User,
  Mail as MailIcon,
  Hash,
  BookOpen,
  Filter,
  ChevronDown,
  Eye,
  EyeOff,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  MoreVertical,
  Calendar,
  Phone,
  GraduationCap,
  Users,
  AlertTriangle
} from "lucide-react";

export default function ManageStudents({ onStudentChanged }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [importErrors, setImportErrors] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", roll_no: "", class_id: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(100);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // list or grid
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [withClassCount, setWithClassCount] = useState(0);
  const [newThisMonthCount, setNewThisMonthCount] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState("");

  const glassCard = "rounded-2xl bg-white/20 backdrop-blur-xl border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]";

  async function loadStudents() {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/students", {
        params: {
          q: search,
          page,
          per_page: perPage,
          class_id: selectedClassId || undefined,   // 👈 नया
        },
      });

      setStudents(res.data.data || []);
      setTotalCount(res.data.total || 0);
      setActiveCount(res.data.active_count || 0);
      setWithClassCount(res.data.with_class_count || 0);
      setNewThisMonthCount(res.data.new_this_month_count || 0);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load students", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadClasses() {
    try {
      const res = await api.get("/admin/classes");
      setClassesList(res.data.data || []);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  }

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, [search, page, selectedClassId]);

  async function handleCreate() {
    if (!form.name || !form.email || !form.roll_no) {
      setToast({ message: "Please fill required fields", variant: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (payload.class_id === "") delete payload.class_id;
      await api.post("/admin/students", payload);
      setForm({ name: "", email: "", password: "", roll_no: "", class_id: "" });
      setToast({ message: "Student created successfully", variant: "success" });
      await loadStudents();
      onStudentChanged?.();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.response?.data?.error || "Creation failed", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  function openEdit(s) {
    setEditing({ ...s });
  }

  async function saveEdit() {
    if (!editing.name || !editing.email || !editing.roll_no) {
      setToast({ message: "Please fill required fields", variant: "warning" });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { name: editing.name, email: editing.email, roll_no: editing.roll_no, class_id: editing.class_id };
      await api.put(`/admin/students/${editing.id}`, payload);
      setEditing(null);
      setToast({ message: "Student updated successfully", variant: "success" });
      await loadStudents();
      onStudentChanged?.();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.response?.data?.error || "Update failed", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  async function delStudent(id) {
    try {
      await api.delete(`/admin/students/${id}`);
      setToast({ message: "Student deleted successfully", variant: "success" });
      setDeleteConfirm(null);
      await loadStudents();
      onStudentChanged?.();
    } catch (err) {
      console.error(err);
      setToast({ message: err?.response?.data?.error || "Delete failed", variant: "error" });
    }
  }

  async function exportCSV() {
    try {
      const res = await api.get("/admin/export/students", { params: { q: search }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setToast({ message: "Export started successfully", variant: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Export failed", variant: "error" });
    }
  }

  async function handleBulkImport(file) {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);
    try {
      const res = await api.post("/admin/students/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Read server response (compatibility with previous/simple responses too)
      const created = res.data?.created_count ?? 0;
      const updated = res.data?.updated_count ?? 0;
      const skipped = res.data?.skipped_count ?? 0;
      const errors = res.data?.errors ?? [];
      const message = res.data?.message ?? "";

      console.log("IMPORT RESPONSE:", res.data);

      // Build a friendly toast message
      let toastMsg = message || `Import finished: ${created} created`;
      if (updated) toastMsg += `, ${updated} updated`;
      if (skipped) toastMsg += `, ${skipped} skipped`;

      setToast({ message: toastMsg, variant: errors.length ? "warning" : "success" });

      // Reset to first page so newly imported students are visible
      setPage(1);

      // Small delay to ensure DB commit visible (usually not required)
      await new Promise((r) => setTimeout(r, 200));

      // Force reload students from server (with updated page/search)
      await loadStudents();
      onStudentChanged?.();

      // If there are errors, log them and show a short warning toast
      // after loadStudents() and toasts...
      if (errors && errors.length > 0) {
        console.warn("Import errors:", errors);
        setImportErrors(errors); // store errors for modal
        setToast({
          message: `Import completed with ${errors.length} error(s). Click to view.`,
          variant: "warning",
        });
      }
    } catch (err) {
      console.error("IMPORT FAILED:", err?.response?.data || err);
      setToast({
        message: err?.response?.data?.error || "Bulk import failed",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAssignClasses() {
    // Open modal or perform mass assignment — for now show toast
    setToast({ message: "Open assign-classes modal (not implemented)", variant: "info" });
  }

  const stats = {
    total: totalCount,
    active: activeCount,
    withClass: withClassCount,
    newThisMonth: newThisMonthCount,
  };



  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden relative">
      {/* Header */}
      <div className={glassCard + " p-4 sm:p-6"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Students</h1>
            <p className="text-gray-600 mt-2">Create and manage student accounts and information</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-medium">Active</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-700 font-medium">With Class</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.withClass}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-medium">New This Month</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.newThisMonth}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                <PlusCircle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: left form, right search + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
        {/* Left: Create Student form (lg:col-span-2) */}
        <div className="lg:col-span-2">
          <div className={`${glassCard} p-4 sm:p-6 mb-4 sm:mb-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <PlusCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
                <p className="text-slate-600 text-sm">Create a new student account</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400/80 focus:border-emerald-400/80 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400/80 focus:border-emerald-400/80 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                  <span className="text-slate-500 text-xs ml-1">
                    (leave blank for auto-generate)
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                    <Hash className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400/80 focus:border-emerald-400/80 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Roll Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    placeholder="2024001"
                    value={form.roll_no}
                    onChange={e => setForm({ ...form, roll_no: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400/80 focus:border-emerald-400/80 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class
                  <span className="text-slate-500 text-xs ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    value={form.class_id}
                    onChange={e => setForm({ ...form, class_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-900 focus:ring-2 focus:ring-emerald-400/80 focus:border-emerald-400/80 outline-none"
                  >
                    <option value="">No class assigned</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.section} ({c.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200/60">
              <div className="text-sm text-slate-600">
                <span className="text-red-500">*</span> Required fields
              </div>
              <button
                onClick={handleCreate}
                disabled={isLoading || !form.name || !form.email || !form.roll_no}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isLoading || !form.name || !form.email || !form.roll_no
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-400 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Add Student
                  </>
                )}
              </button>
            </div>
          </div>
        </div>


        <div className="space-y-3 sm:space-y-4 mt-4 lg:mt-0">
          {/* Quick Actions card (ab upar) */}
          <div className={`${glassCard} p-4`}>
            <h3 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-3 bg-white/70 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-colors group"
              >
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">Bulk Import</div>
                  <div className="text-xs text-slate-500">Upload CSV file</div>
                </div>
              </button>

              <button
                onClick={exportCSV}
                className="w-full flex items-center gap-3 p-3 bg-white/70 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-colors group"
              >
                <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">Export Reports</div>
                  <div className="text-xs text-slate-500">Download CSV of students</div>
                </div>
              </button>

              <button
                onClick={handleAssignClasses}
                className="w-full flex items-center gap-3 p-3 bg-white/70 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-colors group"
              >
                <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">Assign Classes</div>
                  <div className="text-xs text-slate-500">Mass class assignment</div>
                </div>
              </button>
            </div>
          </div>

          {/* Search card (ab niche) */}
          <div className={`${glassCard} p-4`}>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or roll..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white/80 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white/70 hover:bg-white hover:border-slate-300 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  <ChevronDown className="w-4 h-4" />
                </button>

                <div className="flex bg-slate-100/80 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${viewMode === "list"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Grid
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* hidden file input for bulk import */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleBulkImport(file);
              e.target.value = "";
            }}
          />

        </div>
      </div >

      <div className={`${glassCard} overflow-auto h-[90vh] md:h-[calc(100vh-150px)]`}>
        <div className="px-4 py-3 sm:p-6 border-b border-slate-200/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Students</h2>
              <p className="text-slate-600 text-sm mt-1">
                Showing {students.length} students
                {selectedClassId && " for selected class"}
              </p>
            </div>

            {/* Class Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Class:</span>
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedClassId(value ? Number(value) : "");
                    setPage(1);
                  }}

                  className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-white/80 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">All classes</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section ? `- ${c.section}` : ""} ({c.year})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>


        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-600">Loading students...</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-white/90 backdrop-blur border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2 sm:p-4 font-semibold text-slate-700">
                    Student</th>
                  <th className="text-left px-3 py-2 sm:p-4 font-semibold text-slate-700">
                    Roll No</th>
                  <th className="text-left px-3 py-2 sm:p-4 font-semibold text-slate-700">
                    Class</th>
                  <th className="hidden md:table-cell text-left px-3 py-2 sm:p-4 font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="hidden md:table-cell text-left px-3 py-2 sm:p-4 font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/80">
                {students.map(s => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{s.name}</div>
                          <div className="text-sm text-slate-500">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {s.roll_no}
                      </span>
                    </td>
                    <td className="p-4">
                      {s.class_id ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          <BookOpen className="w-4 h-4" />
                          {s.class_id}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Not assigned</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell p-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    </td>

                    {/* Actions – desktop only */}
                    <td className="hidden md:table-cell p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(s.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="md:hidden space-y-3">
            {students.map(s => (
              <div
                key={s.id}
                className="bg-white/90 border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Roll No</p>
                    <p className="font-medium">{s.roll_no}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Class</p>
                    <p className="font-medium">{s.class_id || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                    Active
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirm(s.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        )}

        {students.length === 0 && !isLoading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-white/80 border border-slate-200 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No students found</h3>
            <p className="text-slate-600 mb-4">
              {search
                ? "No students match your search criteria"
                : "Get started by adding your first student"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <XCircle className="w-4 h-4" />
                Clear search
              </button>
            )}
          </div>
        )}
      </div>


      {/* Edit Modal */}
      {
        editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Student</h2>
                  <p className="text-gray-600 text-sm">Update student information</p>
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    value={editing.email}
                    onChange={e => setEditing({ ...editing, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                  <input
                    value={editing.roll_no}
                    onChange={e => setEditing({ ...editing, roll_no: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    value={editing.class_id || ""}
                    onChange={e => setEditing({ ...editing, class_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">No class assigned</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.section} ({c.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setEditing(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full animate-scale-in">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Student</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this student? This action cannot be undone and will remove all associated data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => delStudent(deleteConfirm)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        )
      }


      {/* Import Errors Modal */}
      {importErrors && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Import Errors ({importErrors.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // download CSV of errors
                    const csv = [
                      ["row", "error"],
                      ...importErrors.map(e => [e.row || "", (e.error || JSON.stringify(e)).toString().replace(/\n/g, " ")]),
                    ].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `import_errors_${new Date().toISOString().slice(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                  className="px-3 py-1 bg-slate-100 rounded"
                >
                  Download CSV
                </button>
                <button onClick={() => setImportErrors(null)} className="px-3 py-1 bg-red-600 text-white rounded">Close</button>
              </div>
            </div>

            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-600">
                    <th className="p-2">Row</th>
                    <th className="p-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {importErrors.slice(0, 100).map((err, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 align-top">{err.row ?? "-"}</td>
                      <td className="p-2">{(err.error ?? JSON.stringify(err)).toString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Toast */}
      {
        toast && (
          <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
            <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
          </div>
        )
      }
    </div >
  );
}
