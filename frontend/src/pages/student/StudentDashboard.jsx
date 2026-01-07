import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "../../utils/auth";
import api from "../../api/axios";
import {
  Home,
  ClipboardList,
  Calendar,
  LogOut,
  Menu,
  X,
  Bell,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import ChartCard from "../../components/ChartCard";
import Toast from "../../components/Toast";

export default function StudentDashboard() {
  const user = getUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Data states
  const [attendanceSummary, setAttendanceSummary] = useState(null); // overall
  const [series, setSeries] = useState([]);                         // time-series for current range
  const [yearlyData, setYearlyData] = useState([]);                 // monthly/yearly
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Range + metric for analytics
  const [range, setRange] = useState("month"); // "day" | "week" | "month" | "year"
  const [trendMetric, setTrendMetric] = useState("percentage"); // "percentage" | "present" | "absent"

  const glassCard =
    "rounded-2xl bg-white/20 backdrop-blur-xl border border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]";

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    { key: "attendance", label: "My Attendance", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "trends", label: "Trends", icon: <TrendingUp className="w-4 h-4" /> },
    { key: "schedule", label: "Schedule", icon: <Calendar className="w-4 h-4" /> },
  ];

  // Load analytics (summary + series + yearly)
  useEffect(() => {
    async function loadStudentData() {
      setLoading(true);
      try {
        // 1) Summary (tumhara /student/me/attendance)
        const summaryRes = await api.get("/student/me/attendance");
        const summaryData = summaryRes.data?.data || null;
        setAttendanceSummary(summaryData);

        // 2) Current range analytics (custom endpoint - tum banaoge)
        try {
          const analyticsRes = await api.get("/student/me/analytics", {
            params: { range },
          });
          const analytics = analyticsRes.data?.data || {};
          setSeries(analytics.series || []);
        } catch (_err) {
          // Fallback: single point series from summary
          if (summaryData) {
            setSeries([]);
          } else {
            setSeries([]);
          }
        }

        // 3) Yearly/monthly data from /student/me/graphs 
        try {
          const graphsRes = await api.get("/student/me/graphs");
          const graphsData = graphsRes.data?.data || {};
          setYearlyData(graphsData.monthly || []);
          setClassInfo({
            name: graphsData.class_name || "Class",
            percentage: summaryData?.percentage || 0,
          });
        } catch (_err) {
          setYearlyData([]);
          setClassInfo({
            name: "Class",
            percentage: summaryData?.percentage || 0,
          });
        }
      } catch (err) {
        console.error("Student data load error:", err);
        setToast({
          message: "Could not load attendance data",
          variant: "error",
        });
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    }

    loadStudentData();
  }, [range]);

  function logout() {
    clearAuth();
    navigate("/login");
  }

  // Percentages
  const overallPercent = attendanceSummary?.percentage || 0;
  const totalSessions = attendanceSummary?.total_sessions || attendanceSummary?.total || 0;
  const presentCount = attendanceSummary?.present || 0;
  const absentCount = attendanceSummary?.absent || 0;
  const piePresentPercent =
    totalSessions > 0 ? Math.round((presentCount * 100) / totalSessions) : 0;
  const pieAbsentPercent = 100 - piePresentPercent;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 text-slate-900">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -left-32 -top-24 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute right-0 top-0 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="flex h-full">
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`z-30 w-64
            bg-white/90 backdrop-blur-xl border-r border-white/60 shadow-2xl
            transform transition-transform duration-300
            fixed inset-y-0 left-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            lg:static lg:inset-auto`}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-base sm:text-lg">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm sm:text-base">{user?.name}</div>
                  <div className="text-[11px] sm:text-xs text-slate-600 capitalize">
                    {classInfo?.name || "Student"}
                  </div>
                </div>

              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key);

                      // ✅ Mobile pe sidebar auto-close
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all
  ${active ? "bg-white/60 text-indigo-700 shadow-sm" : "text-slate-700/90 hover:bg-white/20"}`}
                  >

                    <span
                      className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-emerald-500"
                        }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-white/80 rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-6 border-t border-white/30">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4
                  bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl font-medium
                  shadow-lg hover:shadow-xl hover:from-rose-600 hover:to-red-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col lg:ml-0 ml-0 lg:pl-0 pl-0">
          {/* Header */}
          <header className="px-4 sm:px-6 py-3 border-b border-white/20">
            <div className={`${glassCard} px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2 bg-white/30 backdrop-blur-sm rounded-xl"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {activeTab === "dashboard" && "Dashboard"}
                    {activeTab === "attendance" && "My Attendance"}
                    {activeTab === "trends" && "Attendance Trends"}
                    {activeTab === "schedule" && "Schedule"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {overallPercent
                      ? `${overallPercent}% attendance overall`
                      : "Loading attendance..."}
                  </p>
                </div>
              </div>

              {/* Range selector (global) */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:inline-flex rounded-xl bg-white/50 border border-white/70 p-1">
                  {["day", "week", "month", "year"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize ${range === r
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      {r === "day"
                        ? "7 days"
                        : r === "week"
                          ? "8 weeks"
                          : r === "month"
                            ? "30 days"
                            : "Year"}
                    </button>
                  ))}
                </div>
                <Bell className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className={`${glassCard} p-4 sm:p-6 group hover:scale-[1.02] transition-all duration-300`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                        Present
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                      {presentCount}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600">
                      {totalSessions} total sessions
                    </div>
                  </div>

                  <div
                    className={`${glassCard} p-6 group hover:scale-[1.02] transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between mb-2">

                      <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-1 rounded-full">
                        Absent
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {absentCount}
                    </div>
                    <div className="text-sm text-slate-600">sessions missed</div>
                  </div>

                  <div
                    className={`${glassCard} p-6 group hover:scale-[1.02] transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${overallPercent >= 75 ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                      />
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${overallPercent >= 75
                          ? "text-emerald-600 bg-emerald-100"
                          : "text-amber-600 bg-amber-100"
                          }`}
                      >
                        {overallPercent >= 75 ? "Excellent" : "Needs focus"}
                      </span>
                    </div>
                    <div className="text-3xl font-bold mb-1 text-slate-900">
                      {overallPercent}%
                    </div>
                    <div className="text-sm text-slate-600">Overall attendance</div>
                  </div>
                </div>

                {/* Pie + small trend */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie */}
                  {!loading && attendanceSummary && totalSessions > 0 && (
                    <div className={`${glassCard} p-4 sm:p-6`}>
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                            Attendance Breakdown
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            Present vs Absent (overall)
                          </p>
                        </div>
                      </div>

                      <ChartCard
                        type="pie"
                        labels={["Present", "Absent"]}
                        data={[piePresentPercent, pieAbsentPercent]}
                        height={260}
                      />
                    </div>
                  )}

                  {/* Mini trend */}
                  {series.length > 0 && totalSessions > 0 && (
                    <div className={`${glassCard} p-4 sm:p-6`}>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Recent attendance trend
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-600">
                            {range === "day"
                              ? "Last 7 days"
                              : range === "week"
                                ? "Last 8 weeks"
                                : range === "month"
                                  ? "Last 30 days"
                                  : "This year"}
                          </p>
                        </div>
                      </div>
                      <ChartCard
                        type="line"
                        labels={series.map((p) => p.label)}
                        data={series.map((p) => p.percentage)}
                        height={220}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === "attendance" && (
              <div className="space-y-6">
                <div className={`${glassCard} p-4 sm:p-6`}>
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                    Attendance Summary
                  </h3>

                  {attendanceSummary ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 sm:p-4 bg-emerald-50/50 rounded-xl">
                          <span className="text-xs sm:text-sm font-medium text-slate-700">
                            Total Sessions
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-slate-900">
                            {totalSessions}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl">
                          <span className="text-sm font-medium text-slate-700">Present</span>
                          <span className="text-2xl font-bold text-emerald-600">
                            {presentCount}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 bg-rose-50/50 rounded-xl">
                          <span className="text-sm font-medium text-slate-700">Absent</span>
                          <span className="text-2xl font-bold text-rose-600">
                            {absentCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border">
                          <span className="text-sm font-medium text-slate-700">Overall</span>
                          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                            {overallPercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-base sm:text-lg text-slate-500">No attendance data available</p>
                    </div>
                  )}

                  {/* Bar chart per time bucket */}
                  {series.length > 0 && totalSessions > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-2 text-slate-800">
                        {range === "day" && "Last 7 days presence"}
                        {range === "week" && "Weekly presence"}
                        {range === "month" && "Last 30 days presence"}
                        {range === "year" && "Monthly presence"}
                      </h4>
                      <ChartCard
                        type="bar"
                        labels={series.map((p) => p.label)}
                        data={series.map((p) => p.present)}
                        height={260}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TRENDS TAB */}
            {activeTab === "trends" && (
              <div className="space-y-6">
                <div className={`${glassCard} p-6 space-y-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold">Attendance Trends</h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Analyze your attendance over time
                      </p>

                    </div>

                    <div className="flex flex-wrap gap-2 justify-end">
                      {/* Range already global hai, yahan metric selector */}
                      <div className="inline-flex rounded-xl bg-white/40 border border-white/60 p-1">
                        {["percentage", "present", "absent"].map((m) => (
                          <button
                            key={m}
                            onClick={() => setTrendMetric(m)}
                            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs rounded-lg font-medium ${trendMetric === m
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:text-slate-900"
                              }`}
                          >
                            {m === "percentage"
                              ? "% Trend"
                              : m === "present"
                                ? "Present"
                                : "Absent"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {series.length > 0 ? (
                    <ChartCard
                      type="line"
                      labels={series.map((p) => p.label)}
                      data={series.map((p) =>
                        trendMetric === "percentage"
                          ? p.percentage
                          : trendMetric === "present"
                            ? p.present
                            : p.absent
                      )}
                      height={320}
                    />
                  ) : (
                    <div className="text-center py-20">
                      <TrendingUp className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                      <p className="text-lg text-slate-500">
                        Trends will appear here once enough data is available.
                      </p>
                    </div>
                  )}
                </div>

                {/* Yearly overview using /me/graphs monthly data */}
                {yearlyData.length > 0 && (
                  <div className={`${glassCard} p-6`}>
                    <h3 className="text-sm font-semibold mb-3 text-slate-900">
                      Yearly overview
                    </h3>
                    <ChartCard
                      type="bar"
                      labels={yearlyData.map((m) => `M${m.month}`)}
                      data={yearlyData.map((m) => m.percentage)}
                      height={260}
                    />
                  </div>
                )}
              </div>
            )}

            {/* SCHEDULE TAB (placeholder) */}
            {activeTab === "schedule" && (
              <div className={`${glassCard} p-4 sm:p-6 min-h-[320px] sm:min-h-[400px]`}>
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                  Upcoming Schedule
                </h3>
                <div className="text-center py-12 sm:py-20">
                  <Calendar className="w-16 h-16 sm:w-24 sm:h-24 text-slate-300 mx-auto mb-4" />
                  <p className="text-base sm:text-lg text-slate-500 mb-2">
                    Schedule integration coming soon
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Class timetable and upcoming sessions
                  </p>
                </div>
              </div>

            )}
          </main>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
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
