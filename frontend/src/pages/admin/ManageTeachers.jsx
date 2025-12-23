import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Toast from "../../components/Toast";
import {
  Users, UserPlus, Mail, Key, IdCard, BookOpen, Link, Trash2, Edit2,
  Search, Filter, ChevronDown, CheckCircle, XCircle, PlusCircle,
  GraduationCap, Upload, Download, MoreVertical, Eye, EyeOff
} from "lucide-react";

export default function ManageTeachers() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [filterType, setFilterType] = useState("all");
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", employee_id: "" });
  const [assignForm, setAssignForm] = useState({ teacher_id: "", class_id: "" });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("teachers");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [importErrors, setImportErrors] = useState(null);

  const glassCard = "rounded-2xl bg-white/20 backdrop-blur-xl border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]";

  async function load() {
    setIsLoading(true);
    try {
      const [tRes, cRes, mRes] = await Promise.all([
        api.get("/admin/teachers"),
        api.get("/admin/classes"),
        api.get("/admin/teacher-classes")
      ]);
      setTeachers(tRes.data.data || []);
      setClasses(cRes.data.data || []);
      setMappings(mRes.data.data || []);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load data", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    if (teachers.length === 0) {
      load();
    }
  }, []);


  // Create teacher
  async function createTeacher() {
    if (!form.name || !form.email || !form.employee_id) {
      setToast({ message: "Please fill required fields", variant: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // backend will auto-gen
      await api.post("/admin/teachers", payload);
      setForm({ name: "", email: "", password: "", employee_id: "" });
      setToast({ message: "Teacher account created successfully", variant: "success" });
      await load();
    } catch (err) {
      console.error("Create teacher failed:", err);
      setToast({ message: err?.response?.data?.error || "Creation failed", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  // Remove mapping
  async function removeMapping(id) {
    try {
      await api.delete(`/admin/teacher-classes?id=${id}`);
      setToast({ message: "Class assignment removed", variant: "success" });
      await load();
    } catch (err) {
      console.error("Remove mapping failed:", err);
      setToast({ message: "Remove failed", variant: "error" });
    }
  }

  // Assign class to teacher
  async function handleAssignClass() {
    if (!assignForm.teacher_id || !assignForm.class_id) {
      setToast({ message: "Please select both teacher and class", variant: "warning" });
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/admin/teacher-classes", assignForm);
      setToast({ message: "Class assigned successfully", variant: "success" });
      setShowAssignModal(false);
      setAssignForm({ teacher_id: "", class_id: "" });
      await load();
    } catch (err) {
      console.error("Assign class failed:", err);
      setToast({ message: err?.response?.data?.error || "Assignment failed", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  // Export teachers CSV
  async function exportCSV() {
    try {
      const res = await api.get("/admin/export/teachers", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `teachers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setToast({ message: "Export started successfully", variant: "success" });
    } catch (err) {
      console.error("Export failed:", err);
      setToast({ message: "Export failed", variant: "error" });
    }
  }

  // Bulk import (teachers) - expects /admin/teachers/import
  async function handleBulkImport(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setIsLoading(true);
    try {
      const res = await api.post("/admin/teachers/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // handle server response fields if present
      const created = res.data?.created_count ?? 0;
      const updated = res.data?.updated_count ?? 0;
      const skipped = res.data?.skipped_count ?? 0;
      const errors = res.data?.errors ?? [];
      const message = res.data?.message ?? "";

      console.log("IMPORT RESPONSE:", res.data);

      let toastMsg = message || `Import finished: ${created} created`;
      if (updated) toastMsg += `, ${updated} updated`;
      if (skipped) toastMsg += `, ${skipped} skipped`;

      setToast({ message: toastMsg, variant: errors.length ? "warning" : "success" });

      await new Promise(r => setTimeout(r, 200)); // small delay
      await load();

      if (errors && errors.length > 0) {
        console.warn("Import errors:", errors);
        setImportErrors(errors);
        setToast({ message: `Import completed with ${errors.length} error(s). Click to view.`, variant: "warning" });
      }
    } catch (err) {
      console.error("IMPORT FAILED:", err?.response?.data || err);
      setToast({ message: err?.response?.data?.error || "Bulk import failed", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  // UI helpers / stats
  const stats = {
    totalTeachers: teachers.length,
    activeAssignments: mappings.length,
    availableClasses: classes.length,
    unassignedTeachers: teachers.filter(t => !mappings.some(m => m.teacher_id === t.user_id)).length
  };

  const filteredTeachers = teachers
    .filter(t => {
      // Search filter
      const matchesSearch =
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.employee_id || "").toLowerCase().includes(searchTerm.toLowerCase());

      // Class assignment filter
      const classCount = getTeacherClassCount(t);
      if (filterType === "assigned" && classCount === 0) return false;
      if (filterType === "unassigned" && classCount > 0) return false;

      return matchesSearch;
    });


  function getTeacherClassCount(teacher) {
    if (!teacher.teacher_profile_id) return 0;
    return mappings.filter(
      m => m.teacher_id === teacher.teacher_profile_id
    ).length;
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden relative">
      {/* Header + stats */}
      <div className={`${glassCard} p-4 sm:p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Teachers</h1>
            <p className="text-sm text-slate-600 mt-1">Create and manage teacher accounts and class assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-700">Total Teachers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTeachers}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700">Active Assignments</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.activeAssignments}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Link className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Available Classes</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.availableClasses}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-700">Unassigned Teachers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.unassignedTeachers}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${glassCard} p-2`}>
        <div className="flex bg-white/80 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("teachers")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${activeTab === "teachers" ? "bg-white text-slate-900 shadow-sm border-2 border-slate-200" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" /> Teachers
            </div>
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${activeTab === "assignments" ? "bg-white text-slate-900 shadow-sm border-2 border-slate-200" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Link className="w-4 h-4" /> Assignments
            </div>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${activeTab === "create" ? "bg-white text-slate-900 shadow-sm border-2 border-slate-200" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Create
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search
          <div className={`${glassCard} p-4`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teachers by name, email, or employee ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none rounded-xl transition-all text-sm"
              />
            </div>
          </div> */}

          {/* Teachers list / create / assignments */}
          {activeTab === "teachers" && (
            <div className={`${glassCard} max-h-[70vh] sm:max-h-[75vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto`}>
              <div className="p-4 border-b border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">All Teachers</h2>
                    <p className="text-sm text-slate-600 mt-1">Showing {filteredTeachers.length} of {teachers.length} teachers</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setFilterType(prev =>
                          prev === "all" ? "assigned" :
                            prev === "assigned" ? "unassigned" : "all"
                        )
                      }
                      className="flex items-center gap-2 px-3 py-2 bg-white/80 hover:bg-white border border-slate-200 rounded-lg text-sm"
                    >
                      <Filter className="w-4 h-4" />
                      {filterType === "all"
                        ? "All"
                        : filterType === "assigned"
                          ? "Assigned"
                          : "Unassigned"}
                    </button>

                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm text-slate-600">Loading teachers...</p>
                </div>
              ) : filteredTeachers.length > 0 ? (
                <div className="divide-y divide-slate-100/50 overflow-y-auto">
                  {filteredTeachers.map(t => (
                    <div
                      key={t.user_id}
                      className="p-4 hover:bg-slate-50/80 transition-all cursor-pointer group border-l-4 border-transparent hover:border-emerald-400/50"
                      onClick={() => setShowAssignModal(true)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center shadow-sm">
                            <GraduationCap className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0">
                              <h3 className="font-medium text-base text-slate-900 truncate">{t.name}</h3>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{t.email}</span>
                              </div>
                              {t.employee_id && (
                                <div className="flex items-center gap-1">
                                  <IdCard className="w-4 h-4" />
                                  <span className="truncate">{t.employee_id}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3">
                          <div className="text-right hidden md:block">
                            <div className="text-sm font-semibold text-slate-900">
                              {getTeacherClassCount(t)}
                            </div>
                            <div className="text-xs text-slate-500">classes</div>

                          </div>
                          <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto bg-slate-100/50 border border-slate-200 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No teachers found</h3>
                  <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">{searchTerm ? "No teachers match your search criteria" : "Get started by adding your first teacher"}</p>
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 rounded-lg transition-all">
                      <XCircle className="w-4 h-4" /> Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "assignments" && (
            <div className={`${glassCard} overflow-hidden h-[calc(100vh-300px)]`}>
              <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Class Assignments</h2>
                  <p className="text-sm text-slate-600 mt-1">{mappings.length} active assignments</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-lg font-medium shadow-sm"
                >
                  <Link className="w-4 h-4" /> New Assignment
                </button>
              </div>

              {mappings.length > 0 ? (
                <div className="divide-y divide-slate-100/50 overflow-y-auto">
                  {mappings.map(m => (
                    <div key={m.id} className="p-4 hover:bg-slate-50/80 transition-all border-l-4 border-transparent hover:border-purple-400/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1 w-9 h-9 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center shadow-sm">
                            <Link className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-base text-slate-900">{m.teacher_name}</h3>
                              <span className="text-slate-400">→</span>
                              <h3 className="font-medium text-base text-slate-900">{m.class_name}</h3>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                              {m.section && (
                                <div className="flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-lg border border-slate-200">
                                  <BookOpen className="w-3 h-3" /> {m.section}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs">
                                <IdCard className="w-3 h-3" /> ID: {m.teacher_id}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeMapping(m.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shadow-sm ml-2" title="Remove assignment">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center mb-6">
                    <Link className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No class assignments</h3>
                  <p className="text-sm text-slate-600 mb-4 max-w-lg mx-auto">Assign classes to teachers to enable attendance tracking and management</p>
                  <button onClick={() => setShowAssignModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-lg font-medium">
                    <Link className="w-4 h-4" /> Create Assignment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "create" && (
            <div className={`${glassCard} p-4  sm:p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Create New Teacher</h2>
                  <p className="text-sm text-slate-600">Add a new teacher account to the system</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400/80 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" placeholder="teacher@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400/80 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-slate-500 text-xs ml-1">(leave blank for auto-generate)</span></label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"><Key className="w-4 h-4" /></div>
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-900 outline-none text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input placeholder="EMP001" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-900 outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/60">
                <div className="text-sm text-slate-600"><span className="text-red-400">*</span> Required fields</div>
                <button onClick={createTeacher} disabled={isLoading || !form.name || !form.email || !form.employee_id} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm ${isLoading || !form.name || !form.email || !form.employee_id ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-sm"}`}>
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />} {isLoading ? "Creating..." : "Create Teacher"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <div className={`${glassCard} p-4`}>
            <h3 className="font-semibold text-base text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2.5">
              {/* onClick={() => fileInputRef.current?.click()} */}
              <button  className="w-full flex items-center gap-3 p-3 bg-white/70 hover:bg-white border border-slate-200 rounded-xl text-left transition-colors group">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100"><Upload className="w-4 h-4 text-blue-600" /></div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">Bulk Import</div>
                  <div className="text-xs text-slate-500">Upload CSV file</div>
                </div>
              </button>


              {/* onClick={exportCSV} */}
              <button  className="w-full flex items-center gap-3 p-3 bg-white/70 hover:bg-white border border-slate-200 rounded-xl text-left transition-colors group">
                <div className="p-2 bg-green-50 rounded-lg border border-green-100"><Download className="w-4 h-4 text-green-600" /></div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">Export Teachers</div>
                  <div className="text-xs text-slate-500">Download CSV</div>
                </div>
              </button>
            </div>

            <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleBulkImport(file); e.target.value = ""; }} />
          </div>

          {/* <div className={`${glassCard} p-4`}>
            <h3 className="font-semibold text-base text-slate-900 mb-3">Quick Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-600 font-medium">Teachers with Classes</span>
                <span className="font-semibold text-lg text-slate-900">{new Set(mappings.map(m => m.teacher_id)).size}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-600 font-medium">Available Classes</span>
                <span className="font-semibold text-lg text-slate-900">{classes.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-600 font-medium">Avg. Classes/Teacher</span>
                <span className="font-semibold text-lg text-slate-900">{teachers.length > 0 ? (mappings.length / teachers.length).toFixed(1) : 0}</span>
              </div>
            </div>
          </div> */}

        </div>
      </div>


      {/* Assign Class Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${glassCard} p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Assign Class to Teacher</h2>
                <p className="text-sm text-slate-600 mt-1">Link a teacher with a specific class</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100/50 rounded-lg transition-all"><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Teacher</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={assignForm.teacher_id} onChange={e => setAssignForm({ ...assignForm, teacher_id: e.target.value })} className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 bg-white/80 outline-none text-sm">
                    <option value="">Choose a teacher</option>
                    {teachers.map(t => <option key={t.user_id} value={t.user_id}>{t.name} ({t.employee_id})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Class</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={assignForm.class_id} onChange={e => setAssignForm({ ...assignForm, class_id: e.target.value })} className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 bg-white/80 outline-none text-sm">
                    <option value="">Choose a class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section} ({c.year})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-200/60">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-xl">Cancel</button>
              <button onClick={handleAssignClass} disabled={!assignForm.teacher_id || !assignForm.class_id} className={`flex-1 py-2 rounded-xl text-white ${!assignForm.teacher_id || !assignForm.class_id ? "bg-slate-100 text-slate-400" : "bg-gradient-to-r from-purple-500 to-indigo-500"}`}>Assign Class</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && <div className="fixed bottom-4 right-4 z-50 animate-slide-in"><Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} /></div>}
    </div>
  );
}
