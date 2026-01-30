import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  PlusCircle,
  Trash2,
  Edit2,
  Search,
  Filter,
  Calendar,
  Users,
  BookOpen,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function ManageClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: "", section: "", year: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;


  const stats = {
    activeClasses: classes.length,
    totalSections: new Set(classes.map(c => c.section).filter(Boolean)).size,
    thisYear: classes.filter(c => c.year === currentYear).length,
    nextYear: classes.filter(c => c.year === nextYear).length,
  };

  const glassCard =
    "rounded-2xl bg-white/60 backdrop-blur-xl border border-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.18)]";

  async function load() {
    try {
      const res = await api.get("/admin/classes");
      setClasses(res.data.data);
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.name || !form.section || !form.year) {
      // Optional: Add validation feedback here
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/admin/classes", form);
      setForm({ name: "", section: "", year: "" });
      await load();
    } catch (error) {
      console.error("Failed to create class:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/admin/classes/${id}`);
    setShowDeleteConfirm(null);
    load();
  }

  // Filter classes based on search and filter
  const filteredClasses = classes.filter((cls) => {
    const term = searchTerm.trim().toLowerCase();

    // Agar search term empty hai to bas filterYear check karo
    if (!term) {
      return filterYear === "all" || cls.year.toString() === filterYear;
    }

    const name = cls.name?.toLowerCase() || "";
    const section = cls.section?.toLowerCase() || "";

    // Name partial match
    const nameMatches = name.includes(term);

    // Section exact match (case-insensitive)
    const sectionMatches = section === term;

    const matchesSearch = nameMatches || sectionMatches;
    const matchesFilter =
      filterYear === "all" || cls.year.toString() === filterYear;

    return matchesSearch && matchesFilter;
  });

  // Get unique years for filter
  const uniqueYears = [...new Set(classes.map(c => c.year.toString()))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={glassCard + " p-6"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manage Classes</h1>
            <p className="text-gray-600 mt-2">Create and manage class structures for your institution</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium">{classes.length}</span> classes total
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium">Active Classes</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stats.activeClasses}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-medium">Total Sections</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stats.totalSections}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-700 font-medium">This Year</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stats.thisYear}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div className={`${glassCard} p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-medium">Next Year</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {stats.nextYear}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

      </div>

  
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Class List */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className={`${glassCard} overflow-auto h-[60vh] md:h-[calc(100vh-150px)]`}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Class List</h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search classes..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
                    />
                  </div>

                  {/* Filter */}
                  <div className="relative">
                    <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 cursor-pointer hover:border-gray-400 transition-colors">
                      <Filter className="w-5 h-5 text-gray-400" />
                      <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className="appearance-none bg-transparent outline-none cursor-pointer"
                      >
                        <option value="all">All Years</option>
                        {uniqueYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className=" overflow-x-auto">
              {filteredClasses.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-4 font-semibold">Class</th>
                      <th className="text-left p-4 font-semibold">Section</th>
                      <th className="text-left p-4 font-semibold">Year</th>
                      {/* <th className="text-left p-4 font-semibold">Status</th> */}
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map(cls => (
                      <tr
                        key={cls.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{cls.name}</p>
                              <p className="text-xs text-gray-500">ID: {cls.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">{cls.section}</td>

                        <td className="p-4">{cls.year}</td>

                        {/* <td className="p-4">
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                            Active
                          </span>
                        </td> */}

                        <td className="p-4">
                          <div className="flex gap-2">
                            {/* <button className="p-2 hover:bg-blue-50 rounded-lg">
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </button> */}
                            <button
                              onClick={() => setShowDeleteConfirm(cls.id)}
                              className="p-2 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterYear !== "all"
                      ? "Try adjusting your search or filter"
                      : "Create your first class using the form above"
                    }
                  </p>
                  {(searchTerm || filterYear !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterYear("all");
                      }}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <X className="w-4 h-4" />
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Class Form */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PlusCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
                <p className="text-gray-600 text-sm">Add a new class with its details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="e.g., Grade 10, Bachelor of Science"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="e.g., A, B, Science"
                    value={form.section}
                    onChange={e => setForm({ ...form, section: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="e.g., 2024, 2025"
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500">
                  All fields are required
                </div>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting || !form.name || !form.section || !form.year}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all ${isSubmitting || !form.name || !form.section || !form.year
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow hover:shadow-md"
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Create
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Recent Activity */}
        {/* <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Quick Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Classes This Year</span>
                <span className="font-bold text-gray-900">
                  {stats.thisYear}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Unique Sections</span>
                <span className="font-bold text-gray-900">
                   {stats.totalSections}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">Most Common Year</span>
                <span className="font-bold text-gray-900">
                  {classes.length > 0
                    ? [...new Set(classes.map(c => c.year))]
                      .reduce((a, b) =>
                        classes.filter(c => c.year === a).length >
                          classes.filter(c => c.year === b).length ? a : b
                      )
                    : '-'
                  }
                </span>
              </div>
            </div>
          </div>
        </div> */}
      </div>




      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Class</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this class? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}